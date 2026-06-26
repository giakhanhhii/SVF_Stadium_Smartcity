bl_info = {
    "name": "Smart City Auto GLB Export",
    "author": "Vinsmartcity",
    "version": (1, 0, 0),
    "blender": (5, 1, 0),
    "location": "File > Export",
    "description": "Export Smart City web GLBs whenever smartcity-master.blend is saved",
    "category": "Import-Export",
}

import json
from pathlib import Path

import bpy
import mathutils
from bpy.app.handlers import persistent


MASTER_FILENAME = "smartcity-master.blend"
TECHNOPARK_ROOT = "TECHNOPARK_ROOT"
# Blender Z-up -> glTF/three.js Y-up: point (x, y, z) -> (x, z, -y) (rot -90° about X).
_YUP = mathutils.Matrix(((1, 0, 0, 0), (0, 0, 1, 0), (0, -1, 0, 0), (0, 0, 0, 1)))
EXPORT_COLLECTIONS = {
    "SC_TERRAIN": "terrain.glb",
    "SC_ROADS": "roads.glb",
    "SC_BUILDINGS": "buildings.glb",
    "SC_LANDSCAPE": "landscape.glb",
    "SC_VEHICLES": "vehicles.glb",
    "SC_TRAFFIC_LIGHTS": "traffic-lights.glb",
}

_exporting = False


def _output_dir():
    return Path(bpy.data.filepath).resolve().parent.parent / "models" / "smartcity"


def export_technopark_transform(output_dir):
    """Write the TecnoPark placement (position/scale/rotation) as a tiny matrix
    JSON so the website applies it to the geometry-only technopark.glb. This is
    what makes moving / scaling the building in Blender update the web on save
    in real time (the heavy GLB itself is only re-exported when geometry edits;
    see scripts/blender/export_technopark_to_web.py)."""
    root = bpy.data.objects.get(TECHNOPARK_ROOT)
    if root is None:
        return None
    # Convert Blender world matrix into the same Y-up frame the web GLBs use.
    matrix = _YUP @ root.matrix_world @ _YUP.inverted()
    # three.js Matrix4.elements is column-major.
    elements = [round(matrix[r][c], 6) for c in range(4) for r in range(4)]
    (output_dir / "technopark-transform.json").write_text(
        json.dumps({"matrix": elements}), encoding="utf-8"
    )
    return elements


def _collection_objects(collection):
    objects = []
    seen = set()

    def add_with_children(obj):
        if obj.name in seen:
            return
        seen.add(obj.name)
        objects.append(obj)
        for child in obj.children:
            add_with_children(child)

    for obj in collection.objects:
        add_with_children(obj)
    for child in collection.children:
        objects.extend(_collection_objects(child))
    return objects


def _select_only(objects):
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.hide_set(False)
        obj.select_set(True)
    if objects:
        bpy.context.view_layer.objects.active = objects[0]


def export_web_glbs():
    output_dir = _output_dir()
    output_dir.mkdir(parents=True, exist_ok=True)

    selected = list(bpy.context.selected_objects)
    active = bpy.context.view_layer.objects.active
    hidden = {obj: obj.hide_get() for obj in bpy.context.scene.objects}
    mode_object = bpy.context.object
    mode = mode_object.mode if mode_object else "OBJECT"

    exported = {}
    try:
        for collection_name, filename in EXPORT_COLLECTIONS.items():
            collection = bpy.data.collections.get(collection_name)
            if collection is None:
                raise RuntimeError(f"Missing collection: {collection_name}")
            objects = _collection_objects(collection)
            if not objects:
                raise RuntimeError(f"Collection has no objects: {collection_name}")

            filepath = output_dir / filename
            _select_only(objects)
            bpy.ops.export_scene.gltf(
                filepath=str(filepath),
                export_format="GLB",
                use_selection=True,
                export_yup=True,
                export_apply=True,
                export_materials="EXPORT",
                export_animations=False,
                export_cameras=False,
                export_lights=False,
                export_extras=True,
                export_image_format="AUTO",
                export_texcoords=True,
                export_normals=True,
                export_tangents=False,
                export_attributes=True,
            )
            exported[filename] = filepath.stat().st_size
        # TecnoPark: only its placement changes on a normal save -> write the
        # tiny transform JSON (fast, real-time). The geometry GLB stays as-is.
        if export_technopark_transform(output_dir) is not None:
            exported["technopark-transform.json"] = (output_dir / "technopark-transform.json").stat().st_size
    finally:
        bpy.ops.object.select_all(action="DESELECT")
        for obj, was_hidden in hidden.items():
            if obj.name in bpy.context.scene.objects:
                obj.hide_set(was_hidden)
        for obj in selected:
            if obj.name in bpy.context.scene.objects:
                obj.select_set(True)
        if active and active.name in bpy.context.scene.objects:
            bpy.context.view_layer.objects.active = active
        if mode != "OBJECT" and mode_object and mode_object.name in bpy.context.scene.objects:
            try:
                bpy.ops.object.mode_set(mode=mode)
            except RuntimeError:
                pass

    print(f"SMARTCITY_AUTO_EXPORT={exported}")
    return exported


@persistent
def smartcity_export_after_save(_filepath):
    global _exporting
    if _exporting or Path(bpy.data.filepath).name.lower() != MASTER_FILENAME:
        return

    _exporting = True
    try:
        export_web_glbs()
    except Exception as error:
        print(f"SMARTCITY_AUTO_EXPORT_ERROR={error!r}")
    finally:
        _exporting = False


class SMARTCITY_OT_export_web_glbs(bpy.types.Operator):
    bl_idname = "smartcity.export_web_glbs"
    bl_label = "Export Smart City Web GLBs"
    bl_description = "Export terrain, roads, buildings, landscape, and vehicle GLBs used by the website"

    def execute(self, _context):
        try:
            exported = export_web_glbs()
        except Exception as error:
            self.report({"ERROR"}, str(error))
            return {"CANCELLED"}
        self.report({"INFO"}, f"Exported {len(exported)} Smart City GLBs")
        return {"FINISHED"}


def _menu_export(self, _context):
    self.layout.operator(SMARTCITY_OT_export_web_glbs.bl_idname)


def register():
    bpy.utils.register_class(SMARTCITY_OT_export_web_glbs)
    bpy.types.TOPBAR_MT_file_export.append(_menu_export)
    if smartcity_export_after_save not in bpy.app.handlers.save_post:
        bpy.app.handlers.save_post.append(smartcity_export_after_save)


def unregister():
    if smartcity_export_after_save in bpy.app.handlers.save_post:
        bpy.app.handlers.save_post.remove(smartcity_export_after_save)
    bpy.types.TOPBAR_MT_file_export.remove(_menu_export)
    bpy.utils.unregister_class(SMARTCITY_OT_export_web_glbs)


if __name__ == "__main__":
    register()
