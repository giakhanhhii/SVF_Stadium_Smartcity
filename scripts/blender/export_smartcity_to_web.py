import argparse
from pathlib import Path
import sys

import bpy


EXPORT_COLLECTIONS = {
    "SC_TERRAIN": "terrain.glb",
    "SC_ROADS": "roads.glb",
    "SC_BUILDINGS": "buildings.glb",
    "SC_LANDSCAPE": "landscape.glb",
    "SC_VEHICLES": "vehicles.glb",
}


def script_args():
    argv = sys.argv
    args = argv[argv.index("--") + 1 :] if "--" in argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path)
    return parser.parse_args(args)


def default_output_dir():
    blend_path = Path(bpy.data.filepath).resolve()
    if not blend_path.name:
        raise RuntimeError("Save the Smart City .blend file before exporting.")
    return blend_path.parent.parent / "models" / "smartcity"


def collection_objects(collection):
    objects = list(collection.objects)
    for child in collection.children:
        objects.extend(collection_objects(child))
    return objects


def select_only(objects):
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.hide_set(False)
        obj.select_set(True)
    if objects:
        bpy.context.view_layer.objects.active = objects[0]


def export_collection(collection_name, filepath):
    collection = bpy.data.collections.get(collection_name)
    if not collection:
        raise RuntimeError(f"Missing collection: {collection_name}")
    objects = collection_objects(collection)
    if not objects:
        raise RuntimeError(f"Collection has no objects: {collection_name}")

    select_only(objects)
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
    return len(objects)


def main():
    args = script_args()
    output_dir = (args.output_dir or default_output_dir()).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    exported = {}
    for collection_name, filename in EXPORT_COLLECTIONS.items():
        filepath = output_dir / filename
        exported[filename] = {
            "objects": export_collection(collection_name, filepath),
            "bytes": filepath.stat().st_size,
        }

    bpy.ops.object.select_all(action="DESELECT")
    print(f"SMARTCITY_EXPORT_RESULT={exported}")


if __name__ == "__main__":
    main()
