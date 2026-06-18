# Smart City Blender source

`smartcity-master.blend` is the editable source for the static Smart City scene.

## Collections

- `SC_TERRAIN`: ground, park, lake, and grass
- `SC_ROADS`: roads, markings, crosswalks, arrows, and roundabout
- `SC_BUILDINGS`: buildings and facade materials
- `SC_LANDSCAPE`: trees, benches, and parking
- `SC_GUIDES_DO_NOT_EXPORT`: editable road center and roundabout guides
- `SC_PREVIEW_DO_NOT_EXPORT`: Blender-only camera and lights

One Blender unit equals one meter. Keep the four export collections at the world origin.

## Workflow

Rebuild the Blender source from the generated GLB assets:

```powershell
npm.cmd run blender:smartcity:create
```

After editing and saving `smartcity-master.blend`, export the four web GLB files:

```powershell
npm.cmd run blender:smartcity:export
```

Reload the Smart City page to use the updated assets. The export script is also embedded
in the Blender file as `export_smartcity_to_web.py` and can be run from the Scripting workspace.

Validate collection structure, transforms, triangle count, and GLB size:

```powershell
npm.cmd run blender:smartcity:validate
```

The report is written to `performance-report.json`.

The guide curves are references only. Changing road geometry updates the web image after
export, but vehicle routes still need corresponding updates in the traffic route data.
