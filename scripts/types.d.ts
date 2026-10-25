declare module "@mapbox/geojson-rewind" {
  export default function rewind<T>(geojson: T, clockwise?: boolean): T;
}
