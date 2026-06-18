import math
from pathlib import Path

import bpy
from mathutils import Vector


PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_DIR = PROJECT_ROOT / "smartcity-ioc" / "assets" / "models" / "smartcity"
BLENDER_DIR = PROJECT_ROOT / "smartcity-ioc" / "assets" / "blender"
OUTPUT_BLEND = BLENDER_DIR / "smartcity-master.blend"
EXPORT_SCRIPT = PROJECT_ROOT / "scripts" / "blender" / "export_smartcity_to_web.py"

ASSETS = {
    "SC_TERRAIN": MODEL_DIR / "terrain.glb",
    "SC_ROADS": MODEL_DIR / "roads.glb",
    "SC_BUILDINGS": MODEL_DIR / "buildings.glb",
    "SC_LANDSCAPE": MODEL_DIR / "landscape.glb",
    "SC_VEHICLES": MODEL_DIR / "vehicles.glb",
}


def new_collection(name, parent):
    collection = bpy.data.collections.new(name)
    parent.children.link(collection)
    return collection


def remove_import_collections(collections, protected):
    pending = [collection for collection in collections if collection not in protected]
    for collection in reversed(pending):
        if collection.name in bpy.data.collections:
            bpy.data.collections.remove(collection)


def clean_name(name):
    return name.replace(".", "_").replace(" ", "_")


def rounded_value(value):
    if hasattr(value, "__len__") and not isinstance(value, str):
        return tuple(round(float(item), 5) for item in value)
    return round(float(value), 5)


def material_signature(material):
    if not material.use_nodes or not material.node_tree:
        return (
            "simple",
            rounded_value(material.diffuse_color),
            round(material.metallic, 5),
            round(material.roughness, 5),
        )

    nodes = material.node_tree.nodes
    if any(node.type == "TEX_IMAGE" and node.image for node in nodes):
        return None

    principled = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
    if not principled:
        return None

    values = []
    for name in (
        "Base Color",
        "Metallic",
        "Roughness",
        "Alpha",
        "Emission Color",
        "Emission Strength",
    ):
        socket = principled.inputs.get(name)
        values.append(rounded_value(socket.default_value) if socket else None)
    return (
        "principled",
        *values,
        material.surface_render_method,
        material.use_backface_culling,
    )


def consolidate_untextured_materials():
    canonical = {}
    replacements = 0

    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        for slot in obj.material_slots:
            material = slot.material
            if not material:
                continue
            signature = material_signature(material)
            if signature is None:
                continue
            existing = canonical.get(signature)
            if existing:
                slot.material = existing
                replacements += 1
            else:
                canonical[signature] = material

    for material in list(bpy.data.materials):
        if material.users == 0:
            bpy.data.materials.remove(material)
    return replacements


def import_asset(collection_name, filepath, parent_collection):
    if not filepath.exists():
        raise FileNotFoundError(filepath)

    target = new_collection(collection_name, parent_collection)
    before_objects = set(bpy.data.objects)
    before_collections = set(bpy.data.collections)

    bpy.ops.import_scene.gltf(
        filepath=str(filepath),
        import_pack_images=True,
        import_scene_as_collection=True,
        import_select_created_objects=True,
        merge_vertices=False,
    )

    imported_objects = [obj for obj in bpy.data.objects if obj not in before_objects]
    imported_collections = [collection for collection in bpy.data.collections if collection not in before_collections]

    for obj in imported_objects:
        for collection in list(obj.users_collection):
            collection.objects.unlink(obj)
        target.objects.link(obj)

        obj.name = clean_name(obj.name)
        obj["smartcity_export_collection"] = collection_name
        obj["smartcity_source_asset"] = filepath.name
        if obj.data:
            obj.data.name = f"{obj.type}_{obj.name}"
        if obj.type == "MESH":
            obj.data.validate(clean_customdata=False)
            for material in obj.data.materials:
                if material and not material.name.startswith("MAT_"):
                    material.name = f"MAT_{collection_name.removeprefix('SC_')}_{clean_name(material.name)}"

    remove_import_collections(imported_collections, {target})
    return target, imported_objects


def add_curve(collection, name, points, material, cyclic=False):
    curve_data = bpy.data.curves.new(f"CURVE_{name}", "CURVE")
    curve_data.dimensions = "3D"
    curve_data.resolution_u = 2
    curve_data.bevel_depth = 0.045
    curve_data.bevel_resolution = 2
    spline = curve_data.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for point, coordinate in zip(spline.points, points):
        point.co = (*coordinate, 1.0)
    spline.use_cyclic_u = cyclic

    obj = bpy.data.objects.new(name, curve_data)
    obj.hide_render = True
    obj["smartcity_guide"] = True
    curve_data.materials.append(material)
    collection.objects.link(obj)
    return obj


def add_guides(scene_collection):
    guides = new_collection("SC_GUIDES_DO_NOT_EXPORT", scene_collection)
    guide_material = bpy.data.materials.new("MAT_GUIDE_CYAN")
    guide_material.diffuse_color = (0.0, 0.75, 1.0, 1.0)
    guide_material.metallic = 0.0
    guide_material.roughness = 0.45

    add_curve(
        guides,
        "GUIDE_RoadCenter_EW",
        [(-60.0, 0.0, 0.18), (60.0, 0.0, 0.18)],
        guide_material,
    )
    add_curve(
        guides,
        "GUIDE_RoadCenter_NS",
        [(0.0, -60.0, 0.18), (0.0, 60.0, 0.18)],
        guide_material,
    )
    circle_points = []
    for index in range(64):
        angle = index / 64.0 * math.tau
        circle_points.append((math.cos(angle) * 5.35, math.sin(angle) * 5.35, 0.2))
    add_curve(guides, "GUIDE_RoundaboutCenter", circle_points, guide_material, cyclic=True)
    return guides


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_preview(scene_collection, scene):
    preview = new_collection("SC_PREVIEW_DO_NOT_EXPORT", scene_collection)

    camera_data = bpy.data.cameras.new("CAM_SmartCityPreview")
    camera = bpy.data.objects.new("CAM_SmartCityPreview", camera_data)
    preview.objects.link(camera)
    camera.location = (44.0, -58.0, 42.0)
    camera_data.lens = 52
    look_at(camera, (0.0, 0.0, 4.0))
    scene.camera = camera

    sun_data = bpy.data.lights.new("LIGHT_SmartCitySun", "SUN")
    sun_data.energy = 2.2
    sun_data.angle = math.radians(18)
    sun = bpy.data.objects.new("LIGHT_SmartCitySun", sun_data)
    sun.rotation_euler = (math.radians(28), math.radians(-18), math.radians(-35))
    preview.objects.link(sun)

    area_data = bpy.data.lights.new("LIGHT_SmartCityFill", "AREA")
    area_data.energy = 900
    area_data.shape = "DISK"
    area_data.size = 18
    area = bpy.data.objects.new("LIGHT_SmartCityFill", area_data)
    area.location = (-18.0, -20.0, 24.0)
    look_at(area, (0.0, 0.0, 3.0))
    preview.objects.link(area)


def configure_scene(scene):
    scene.name = "SmartCity_Master"
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 60
    if not scene.world:
        scene.world = bpy.data.worlds.new("WORLD_SmartCity")
    scene.world.color = (0.08, 0.14, 0.2)
    scene["smartcity_project_root"] = str(PROJECT_ROOT)
    scene["smartcity_web_model_dir"] = str(MODEL_DIR)
    scene["smartcity_units"] = "1 Blender unit = 1 meter"
    scene["smartcity_axis_note"] = "Blender Z-up; glTF export converts to web Y-up"


def embed_export_script():
    if EXPORT_SCRIPT.exists():
        text = bpy.data.texts.get("export_smartcity_to_web.py")
        if text:
            bpy.data.texts.remove(text)
        text = bpy.data.texts.load(str(EXPORT_SCRIPT))
        text.name = "export_smartcity_to_web.py"


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    configure_scene(scene)

    root = new_collection("SMARTCITY_WEB_SOURCE", scene.collection)
    imported_summary = {}
    for collection_name, filepath in ASSETS.items():
        collection, objects = import_asset(collection_name, filepath, root)
        imported_summary[collection.name] = len(objects)

    material_replacements = consolidate_untextured_materials()
    add_guides(scene.collection)
    add_preview(scene.collection, scene)
    embed_export_script()

    BLENDER_DIR.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)

    result = {
        "blend": str(OUTPUT_BLEND),
        "collections": imported_summary,
        "objects": len(bpy.data.objects),
        "meshes": len(bpy.data.meshes),
        "materials": len(bpy.data.materials),
        "material_replacements": material_replacements,
    }
    print(f"SMARTCITY_BLEND_RESULT={result}")


if __name__ == "__main__":
    main()
