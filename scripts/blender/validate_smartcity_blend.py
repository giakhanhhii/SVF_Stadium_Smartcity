import json
from pathlib import Path

import bpy


PROJECT_ROOT = Path(__file__).resolve().parents[2]
REPORT_PATH = (
    PROJECT_ROOT
    / "smartcity-ioc"
    / "assets"
    / "blender"
    / "performance-report.json"
)
MODEL_DIR = PROJECT_ROOT / "smartcity-ioc" / "assets" / "models" / "smartcity"
EXPORT_COLLECTIONS = ["SC_TERRAIN", "SC_ROADS", "SC_BUILDINGS", "SC_LANDSCAPE", "SC_VEHICLES"]


def recursive_objects(collection):
    objects = list(collection.objects)
    for child in collection.children:
        objects.extend(recursive_objects(child))
    return objects


def mesh_triangles(obj):
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def main():
    collection_stats = {}
    export_objects = []
    missing = []

    for name in EXPORT_COLLECTIONS:
        collection = bpy.data.collections.get(name)
        if not collection:
            missing.append(name)
            continue
        objects = recursive_objects(collection)
        meshes = [obj for obj in objects if obj.type == "MESH"]
        export_objects.extend(objects)
        collection_stats[name] = {
            "objects": len(objects),
            "meshes": len(meshes),
            "triangles": sum(mesh_triangles(obj) for obj in meshes),
            "material_slots": sum(len(obj.material_slots) for obj in meshes),
        }

    mesh_objects = [obj for obj in export_objects if obj.type == "MESH"]
    non_unit_scale = [
        obj.name
        for obj in mesh_objects
        if any(abs(value - 1.0) > 0.0001 for value in obj.scale)
    ]
    glb_files = {
        path.name: path.stat().st_size
        for path in sorted(MODEL_DIR.glob("*.glb"))
    }

    report = {
        "blend_file": bpy.data.filepath,
        "blender_version": bpy.app.version_string,
        "units": {
            "system": bpy.context.scene.unit_settings.system,
            "scale_length": bpy.context.scene.unit_settings.scale_length,
        },
        "collections": collection_stats,
        "totals": {
            "objects": len(export_objects),
            "mesh_objects": len(mesh_objects),
            "triangles": sum(mesh_triangles(obj) for obj in mesh_objects),
            "materials": len(bpy.data.materials),
            "images": len(bpy.data.images),
            "glb_bytes": sum(glb_files.values()),
        },
        "glb_files": glb_files,
        "checks": {
            "missing_collections": missing,
            "non_unit_scale_objects": non_unit_scale,
            "triangle_budget_ok": sum(mesh_triangles(obj) for obj in mesh_objects) < 20000,
            "glb_size_budget_ok": sum(glb_files.values()) < 5 * 1024 * 1024,
        },
    }

    REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"SMARTCITY_VALIDATION_RESULT={json.dumps(report)}")

    if missing:
        raise RuntimeError(f"Missing export collections: {missing}")


if __name__ == "__main__":
    main()
