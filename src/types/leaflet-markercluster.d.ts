import 'leaflet';

declare module 'leaflet' {
  namespace MarkerClusterGroup {
    interface Options {
      maxClusterRadius?: number;
      spiderfyOnMaxZoom?: boolean;
      showCoverageOnHover?: boolean;
      zoomToBoundsOnClick?: boolean;
      chunkedLoading?: boolean;
      chunkInterval?: number;
    }
  }

  class MarkerClusterGroup extends FeatureGroup {
    constructor(options?: MarkerClusterGroup.Options);
    addLayer(layer: Layer): this;
    removeLayer(layer: Layer): this;
    clearLayers(): this;
  }

  function markerClusterGroup(options?: MarkerClusterGroup.Options): MarkerClusterGroup;
}

