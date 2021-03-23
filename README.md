# Exercise Map

Steps:
Marshall exercises most to least recent in the following format:

```json
[
  {
    "map": {
      "summary_polyline": "<a polyline>"
    },
    "name": "<name>",
    "type": "<Run|Bike|Walk>",
    "start_date_local": "<parseable by `new Date(start_date_local)`>",
    "distance": "<unused but will throw error if not provided>",
    "elapsed_time": "<unused but will throw error if not provided>",
    "moving_time": "<unused but will throw error if not provided>"
  },
  {...}
]
```

Open up app.html and load your json file.