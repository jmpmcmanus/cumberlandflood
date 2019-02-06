<template xmlns:>
  <div id="app" :class="[$options.name]">
    <!-- app map -->
    <vl-map v-if="mapVisible" class="map" ref="map" :load-tiles-while-animating="true" :load-tiles-while-interacting="true"
            @click="onMapClick" @postcompose="onMapPostCompose"
            data-projection="EPSG:4326" @mounted="onMapMounted">
      <!-- map view aka ol.View -->
      <vl-view ref="view" :center.sync="center" :zoom.sync="zoom" :rotation.sync="rotation"></vl-view>

      <vl-overlay class="feature-popup" v-if="deviceCoordinate" :position="deviceCoordinate" style="background: white; padding: 10px">
        <template slot-scope="popup">
          <section class="card">
            <header class="card-header">
              <div v-if="featureID !== undefined">
                <p class="card-header-title">
                  Parcel: {{ featureID }}
                </p>
              </div>
              <a class="card-header-icon" title="Close"
                 @click="onMapDoneClick(), deviceCoordinate = undefined">
                 <b-icon icon="close"></b-icon>
              </a>
            </header>
            <div class="card-content">
              <div class="content">
                <div v-if="featureID !== undefined">
                  <div v-if="parcelValue !== undefined">
                    Description: {{ Props.parusedesc }}</br>
                    Parcel Value: {{ parcelValue }}</br>
                    Land Value: {{ Props.landval }}</br>
                    Improvement Value: {{ Props.improvval }}</br>
                    Color Value: {{ Props.color }}</br>
                    <div v-if="Props.struct === 'Y'">
                      Structures: {{ Props.structno }},</br>
                      Year Built: {{ Props.structyear }}
                    </div>
                  </div>
                  <div v-else-if="bldgValue !== undefined">
                    Building Value: {{ bldgValue }}</br>
                    Replacement Value: {{ Props.bldgrepval }}</br>
                    Heated Square Feet: {{ Props.htd_sq_ft }}</br>
                    Flood Levels: {{Props.fldlevels}}
                  </div>
                  <div v-else>
                    Shit
                  </div>
                </div>
                <div v-else-if="featureID === undefined">
                </div>
                <div v-else>
                </div> 
              </div>
            </div>
          </section>
        </template>        
      </vl-overlay>

      <!-- geolocation -->
      <vl-geoloc @update:position="onUpdatePosition">
        <template slot-scope="geoloc">
          <vl-feature v-if="geoloc.position" id="position-feature">
            <vl-geom-point :coordinates="geoloc.position"></vl-geom-point>
            <vl-style-box>
              <vl-style-icon src="../assets/marker.png" :scale="0.4" :anchor="[0.5, 1]"></vl-style-icon>
            </vl-style-box>
          </vl-feature>
        </template>
      </vl-geoloc>
      <!--// geolocation -->

      <!-- base layers -->
      <vl-layer-tile v-for="layer in baseLayers" :key="layer.name" :id="layer.name" :visible="layer.visible">
        <component :is="'vl-source-' + layer.name" v-bind="layer"></component>
      </vl-layer-tile>
      <!--// base layers -->

      <!-- other layers from config -->
      <component v-for="layer in layers" :is="layer.cmp" v-if="layer.visible" :key="layer.id" v-bind="layer">
        <!-- add vl-source-* -->
        <component :is="layer.source.cmp" v-bind="layer.source">
        </component>

        <!-- add style components if provided -->
        <!-- create vl-style-box or vl-style-func -->
        <component v-if="layer.style" v-for="(style, i) in layer.style" :key="i" :is="style.cmp" v-bind="style">
          <!-- create inner style components: vl-style-circle, vl-style-icon, vl-style-fill, vl-style-stroke & etc -->
          <component v-if="style.styles" v-for="(st, cmp) in style.styles" :key="cmp" :is="cmp" v-bind="st">
            <!-- vl-style-fill, vl-style-stroke if provided -->
            <vl-style-fill v-if="st.fill" v-bind="st.fill"></vl-style-fill>
            <vl-style-stroke v-if="st.stroke" v-bind="st.stroke"></vl-style-stroke>
          </component>
        </component>
        <!--// style -->
      </component>
      <!--// other layers -->

    </vl-map>
    <!--// app map -->

    <!-- map panel, controls -->
    <div class="map-panel">
      <b-collapse class="panel box is-paddingless" :open.sync="panelOpen">
        <div slot="trigger" class="panel-heading">
          <div class="columns">
            <div class="column is-11">
              <strong>Map panel</strong>
            </div>
            <div class="column">
              <b-icon :icon="panelOpen ? 'chevron-up' : 'chevron-down'" size="is-small"></b-icon>
            </div>
          </div>
        </div>
        <p class="panel-tabs">
          <a @click="showMapPanelTab('layers')" :class="mapPanelTabClasses('layers')">Layers</a>
          <a @click="showMapPanelTab('state')" :class="mapPanelTabClasses('state')">State</a>
          <a @click="showMapPanelTab('legend')" :class="mapPanelTabClasses('legen')">Legend</a>
        </p>

        <div class="panel-block" v-for="layer in layers" :key="layer.id" @click="showMapPanelLayer"
             :class="{ 'is-active': layer.visible }"
             v-show="mapPanel.tab === 'layers'">
          <b-switch :key="layer.id" v-model="layer.visible">
            {{ layer.title }}
          </b-switch>
        </div>

        <div class="panel-block" v-show="mapPanel.tab === 'state'">
          <table class="table is-fullwidth">
            <tr>
              <th>Map center</th>
              <td>{{ center }}</td>
            </tr>
            <tr>
              <th>Map zoom</th>
              <td>{{ zoom }}</td>
            </tr>
            <tr>
              <th>Map rotation</th>
              <td>{{ rotation }}</td>
            </tr>
            <tr>
              <th>Device coordinate</th>
              <td>{{ deviceCoordinate }}</td>
            </tr>
            <tr>
              <th>Selected features</th>
              <td>{{ featureID }}</td>
            </tr>
          </table>
        </div>

        <div class="panel-block" v-show="mapPanel.tab === 'legend'">
          <table class="table is-fullwidth">
            <tr>
              <b-collapse :open="false">
                <div slot="trigger">
                   <th>Florence Flood Levels</th>
                </div>
                <div class="content">
                  <table class="table is-fullwidth">
                    <tr>
                      <td style="background-color: hsla(196, 73%, 52%, 1)">&nbsp;</td>
                      <td>Flood Level 1 (Depth Less than 5 Feet)</td>
                    </tr>
                    <tr>
                      <td style="background-color: hsla(245, 84%, 52%, 1)">&nbsp;</td>
                      <td>Flood Level 2 (Depth 5 to 10 Feet)</td>
                    </tr>
                    <tr>
                      <td style="background-color: hsla(248, 83%, 36%, 1)">&nbsp;</td>
                      <td>Flood Level 3 (Depth 10 to 15 Feet)</td>
                    </tr>
                    <tr>
                      <td style="background-color: hsla(288, 85%, 49%, 1)">&nbsp;</td>
                      <td>Flood Level 4 (Depth 15 to 20 Feet)</td>
                    </tr>
                    <tr>
                      <td style="background-color: hsla(317, 86%, 50%, 1)">&nbsp;</td>
                      <td>Flood Level 5 (Depth Greater than 20 Feet)</td>
                    </tr>
                    <tr>
                      <td><b>Source</b></td>
                      <td>This data was derived from 
                        <a href="https://usace.maps.arcgis.com/apps/webappviewer/index.html?id=d9b3aab757f64e1897f8a75efd4d3975" target="_blank">
                        US Army Corp of Engineers, Modeled Flood Depth Data</a></td>
                    </tr>
                  </table>
                </div>
              </b-collapse>
            </tr>
            <tr>
              <b-collapse :open="false">
                <div slot="trigger">
                   <th>FEMA Flood Hazards Zones</th>
                </div>
                <div class="content">
                  <table class="table is-fullwidth">
                    <tr>
                      <td style="background-color: hsla(192, 83%, 54%, 1)">&nbsp;</td>
                      <td>Flood Zone A - 100 Year Flood, Base Flood Elevation Not Determined</td>
                    </tr>
                    <tr>
                      <td style="background-color: hsla(208, 80%, 52%, 1)">&nbsp;</td>
                      <td>Flood Zone AE - 100 Year Flood, Base Flood Elevation Determined</td>
                    </tr>
                    <tr>
                      <td style="background-color: hsla(243, 88%, 30%, 1)">&nbsp;</td>
                      <td>Flood Zone AE - Floodway - 100 Year Flood, Base Flood Elevation Determined</td>
                    </tr>
                    <tr>
                      <td style="background-color: hsla(178, 87%, 55%, 1)">&nbsp;</td>
                      <td>0.2 PCT ANNUAL CHANCE FLOOD HAZARD - 500 Year Flood</td>
                    </tr>
                    <tr>
                      <td><b>Source</b></td>
                      <td>This data was derived from <a href="https://flood.nc.gov/ncflood/" target="_blank">
                      FEMA flood plain data</a>
                      </td>
                    </tr>
                  </table>
                </div>
              </b-collapse>
            </tr>
            <tr>
              <b-collapse :open="false">
                <div slot="trigger">
                   <th>Flooded Areas in Property Parcels</th>
                </div>
                <div class="content">
                  <table class="table is-fullwidth">
                    <tr>
                      <td style="background-color: hsla(2, 100%, 85%, 1)">&nbsp;</td>
                      <td>Flood level 1 (Depth Less than 5 Feet)</td>
                    </tr>
                    <tr>
                      <td style="background-color: hsla(353, 100%, 75%, 1)">&nbsp;</td>
                      <td>Flood Level 2 (Depth 5 to 10 Feet)</td>
                    </tr>
                    <tr>
                      <td style="background-color: hsla(0, 100%, 65%, 1)">&nbsp;</td>
                      <td>Flood Level 3 (Depth 10 to 15 Feet)</td>
                    </tr>
                    <tr>
                      <td style="background-color: hsla(0, 100%, 57%, 1)">&nbsp;</td>
                      <td>Flood Level 4 (Depth 15 to 20 Feet)</td>
                    </tr>
                    <tr>
                      <td style="background-color: hsla(1, 100%, 53%, 1)">&nbsp;</td>
                      <td>Flood Level 5 (Depth Greater than 20 Feet)</td>
                    </tr>
                    <tr>
                      <td><b>Source</b></td>
                      <td>This data was derived from 
                        <a href="https://usace.maps.arcgis.com/apps/webappviewer/index.html?id=d9b3aab757f64e1897f8a75efd4d3975" target="_blank">
                        US Army Corp of Engineers, Modeled Flood Depth Data</a> and 
                        <a href="http://www.nconemap.com/ParcelsforNorthCarolina.aspx" target="_blank">Cumberland County property parcel data</a>
                      </td>
                    </tr>
                  </table>
                </div>
              </b-collapse>
            </tr>
            <tr>
              <b-collapse :open="false">
                <div slot="trigger">
                  <th>Fooded Property Parcels</th>
                </div>
                <div class="content">
                  <table class="table is-fullwidth">
                    <tr>
                      <td style="background-color: hsla(134, 89%, 51%, 1)">&nbsp;</td>
                      <td>Property Values $50,000 and Below</td>
                    </tr>
                    <tr>
                      <td style="background-color: hsla(78, 89%, 51%, 1)">&nbsp;</td>
                      <td>Property Values Between $50,001 and $100,000</td>
                    </tr>
                    <tr>
                      <td style="background-color: hsla(116, 89%, 51%, 1)">&nbsp;</td>
                      <td>Property Values Between $100,001 and $150,000</td>
                    </tr>
                    <tr>
                      <td style="background-color: hsla(117, 76%, 35%, 1)">&nbsp;</td>
                      <td>Property Values Between $150,001 and $200,000</td>
                    </tr>
                    <tr>
                      <td style="background-color: hsla(117, 77%, 23%, 1)">&nbsp;</td>
                      <td>Property Values Between $200,001 and $250,000</td>
                    </tr>
                    <tr>
                      <td style="background-color: hsla(108, 92%, 9%, 1)">&nbsp;</td>
                      <td>Property Values Above $250,000</td>
                    </tr>
                    <tr>
                      <td><b>Source</b></td>
                      <td>This data was derived from 
                        <a href="https://usace.maps.arcgis.com/apps/webappviewer/index.html?id=d9b3aab757f64e1897f8a75efd4d3975" target="_blank">
                        US Army Corp of Engineers, Modeled Flood Depth Data</a> and 
                        <a href="http://www.nconemap.com/ParcelsforNorthCarolina.aspx" target="_blank">Cumberland County property parcel data</a>
                      </td>
                    </tr>
                  </table>
                </div>
              </b-collapse>
            </tr>
            <tr>
              <b-collapse :open="false">
                <div slot="trigger">
                   <th>Flooded Buildings</th>
                </div>
                <div class="content">
                  <table class="table is-fullwidth">
                    <tr>
                      <td style="background-color: hsla(0, 0%, 2%, 1)">&nbsp;</td>
                      <td>Flooded Buildings</td>
                    </tr>
                    <tr>
                      <td style="background-color: hsla(30, 1%, 38%, 1)">&nbsp;</td>
                      <td>Buildings in Flooded Parcels, but not Flooded</td>
                    </tr>
                    <tr>
                      <td><b>Source</b></td>
                      <td>This data was derived from 
                        <a href="https://usace.maps.arcgis.com/apps/webappviewer/index.html?id=d9b3aab757f64e1897f8a75efd4d3975" target="_blank">
                        US Army Corp of Engineers, Modeled Flood Depth Data</a> and 
                        <a href="http://opendata.co.cumberland.nc.us/" target="_blank">Cumberland County building data</a>
                      </td>
                    </tr>
                  </table>
                </div>
              </b-collapse>
            </tr>
          </table>
        </div>
      </b-collapse>
    </div>
    <!--// map panel, controls -->

    <!-- base layers switch -->
    <div class="base-layers-panel">
      <div class="buttons has-addons">
        <button class="button is-light" v-for="layer in baseLayers"
                :key="layer.name" :class="{ 'is-info': layer.visible }"
                @click="showBaseLayer(layer.name)">
          {{ layer.title }}
        </button>
        <button class="button is-light" @click="mapVisible = !mapVisible">
          {{ mapVisible ? 'Hide map' : 'Show map' }}
        </button>
      </div>
    </div>
    <!--// base layers -->
  </div>
</template>

<script>
  import { kebabCase, camelCase } from 'lodash'
  import { createProj, addProj, findPointOnSurface, createStyle } from 'vuelayers/lib/ol-ext'
  import ScaleLine from 'ol/control/ScaleLine'
  import FullScreen from 'ol/control/FullScreen'
  import OverviewMap from 'ol/control/OverviewMap'
  import ZoomSlider from 'ol/control/ZoomSlider'
  import { Style, Fill, Stroke } from 'ol/style'

  function convertHex (hex, opacity) {
    var r, g, b, result
    hex = hex.replace('#', '')
    r = parseInt(hex.substring(0, 2), 16)
    g = parseInt(hex.substring(2, 4), 16)
    b = parseInt(hex.substring(4, 6), 16)

    result = 'rgba(' + r + ',' + g + ',' + b + ',' + opacity / 100 + ')'
    return result
  }
  // Custom projection for static Image layer
  let x = 1024 * 10000
  let y = 968 * 10000
  let imageExtent = [-x / 2, -y / 2, x / 2, y / 2]
  let customProj = createProj({
    code: 'xkcd-image',
    units: 'pixels',
    extent: imageExtent,
  })
  // add to the list of known projections
  // after that it can be used by code
  addProj(customProj)

  const easeInOut = t => 1 - Math.pow(1 - t, 3)

  export default {
    name: 'HurricaneFlorence',
    data () {
      return {
        center: [-78.858775, 35.074792],
        zoom: 12,
        rotation: 0,
        selectedFeatures: [],
        deviceCoordinate: undefined,
        featureID: 0,
        parcelValue: undefined,
        bldgValue: undefined,
        Props: {},
        mapPanel: {
          tab: 'layers',
        },
        panelOpen: true,
        mapVisible: true,
        vtIdProp: 'gid',
        vtSelection: {},
        vtSelectMode: 'single',
        drawType: undefined,
        drawnFeatures: [],
        // base layers
        baseLayers: [
          {
            name: 'osm',
            title: 'OpenStreetMap',
            visible: true,
          },
          {
            name: 'mapbox',
            title: 'Mapbox Satellite',
            // mapId: 'mapbox.mapbox-streets-v7',
            mapId: 'mapbox.satellite',
            accessToken: 'sk.eyJ1IjoiY29kZWZvcmFtZXJpY2EiLCJhIjoiY2ptd3F1d2Q4MDJ4djNxcjJ6NDltNzhnayJ9.4wsfBXJpT4y9L4tahnag9g',
            visible: false,
          },
        ],
        // layers config
        layers: [
          {
            id: 'cumber_fld_flddepth',
            title: 'Florence Flood Levels',
            cmp: 'vl-layer-tile',
            visible: true,
            source: {
              cmp: 'vl-source-xyz',
              // url: 'https://hurricane-florence-tilestache.herokuapp.com/cumber_fld_flddepth/{z}/{x}/{y}.pbf',
              // url: 'http://127.0.0.1:8080/cumber_fld_flddepth/{z}/{x}/{y}.png',
              // url: 'http://cumberstache.s3-website.us-east-1.amazonaws.com/cumber_fld_flddepth/{z}/{x}/{y}.png',
              url: 'http://s3.wasabisys.com/cumberstatche/cumber_fld_flddepth/{z}/{x}/{y}.png',
            },
          },
          {
            id: 'cumber_fld_haz',
            title: 'FEMA Flood Hazard Zones',
            cmp: 'vl-layer-tile',
            visible: false,
            source: {
              cmp: 'vl-source-xyz',
              // url: 'https://hurricane-florence-tilestache.herokuapp.com/cumber_fld_haz/{z}/{x}/{y}.pbf',
              // url: 'http://127.0.0.1:8080/cumber_fld_haz/{z}/{x}/{y}.pbf',
              // url: 'http://127.0.0.1:8080/cumber_fld_haz/{z}/{x}/{y}.png',
              url: 'http://s3.wasabisys.com/cumberstatche/cumber_fld_haz/{z}/{x}/{y}.png',
            },
          },
          {
            id: 'cumber_fld_par_flddepth',
            title: 'Flooded Areas in Property Parcels',
            cmp: 'vl-layer-tile',
            visible: false,
            source: {
              cmp: 'vl-source-xyz',
              // url: 'https://hurricane-florence-tilestache.herokuapp.com/cumber_fld_par_flddepth/{z}/{x}/{y}.pbf',
              // url: 'http://127.0.0.1:8080/cumber_fld_par_flddepth/{z}/{x}/{y}.pbf',
              // url: 'http://127.0.0.1:8080/cumber_fld_par_flddepth/{z}/{x}/{y}.png',
              url: 'http://s3.wasabisys.com/cumberstatche/cumber_fld_par_flddepth/{z}/{x}/{y}.png',
            },
            style: [
              {
                cmp: 'vl-style-func',
                factory: this.getFldParDepthStyle,
              },
            ],
          },
          {
            id: 'cumber_fld_par',
            title: 'Flooded Property Parcels',
            cmp: 'vl-layer-vector-tile',
            ref: 'vtLayer',
            visible: false,
            source: {
              cmp: 'vl-source-vector-tile',
              // url: 'https://hurricane-florence-tilestache.herokuapp.com/cumber_fld_par/{z}/{x}/{y}.pbf',
              // url: 'http://127.0.0.1:8080/cumber_fld_par/{z}/{x}/{y}.pbf',
              url: 'http://s3.wasabisys.com/cumberstatche/cumber_fld_par/{z}/{x}/{y}.pbf',
            },
            style: [
              {
                cmp: 'vl-style-func',
                factory: this.getFldParStyle,
              },
            ],
          },
          {
            id: 'cumber_fld_parbldg',
            title: 'Flooded Property Buildings',
            cmp: 'vl-layer-vector-tile',
            ref: 'vtLayer',
            visible: false,
            source: {
              cmp: 'vl-source-vector-tile',
              // url: 'https://hurricane-florence-tilestache.herokuapp.com/cumber_fld_parbldg/{z}/{x}/{y}.pbf',
              // url: 'http://127.0.0.1:8080/cumber_fld_parbldg/{z}/{x}/{y}.pbf',
              url: 'http://s3.wasabisys.com/cumberstatche/cumber_fld_parbldg/{z}/{x}/{y}.pbf',

            },
            style: [
              {
                cmp: 'vl-style-func',
                factory: this.getFldParBldgStyle,
              },
            ],
          },
        ],
      }
    },
    methods: {
      camelCase,
      pointOnSurface: findPointOnSurface,
      geometryTypeToCmpName (type) {
        return 'vl-geom-' + kebabCase(type)
      },
      getFldParDepthStyle () {
        return feature => {
          let selected = !!this.vtSelection[feature.get(this.vtIdProp)]

          return [
            new Style({
              stroke: new Stroke({
                color: selected ? 'rgba(255,239,10,0.8)' : '#FA0312', // feature.get('color'),
                width: selected ? 1 : 0.5,
              }),
              fill: new Fill({
                color: selected ? 'rgba(255,239,10,0.8)' : feature.get('color'),
              }),
            }),
          ]
        }
      },
      getFldParStyle () {
        return feature => {
          let selected = !!this.vtSelection[feature.get(this.vtIdProp)]

          return [
            new Style({
              stroke: new Stroke({
                color: selected ? 'rgba(255,239,10,0.8)' : '#535263', // feature.get('color'),
                width: selected ? 1 : 0.5,
              }),
              fill: new Fill({
                color: selected ? 'rgba(255,239,10,0.8)' : convertHex(feature.get('color'), 50),
              }),
            }),
          ]
        }
      },
      getFldParBldgStyle () {
        return feature => {
          let selected = !!this.vtSelection[feature.get(this.vtIdProp)]

          return [
            new Style({
              stroke: new Stroke({
                color: selected ? 'rgba(255,239,10,0.8)' : feature.get('color'),
                width: selected ? 1 : 0.5,
              }),
              fill: new Fill({
                color: selected ? 'rgba(255,239,10,0.8)' : feature.get('color'),
              }),
            }),
          ]
        }
      },

      onUpdatePosition (coordinate) {
        this.deviceCoordinate = coordinate
      },
      onMapPostCompose ({ vectorContext, frameState }) {
        if (!this.$refs.marker || !this.$refs.marker.$feature) return

        const feature = this.$refs.marker.$feature
        if (!feature.getGeometry() || !feature.getStyle()) return

        const flashGeom = feature.getGeometry().clone()
        const duration = feature.get('duration')
        const elapsed = frameState.time - feature.get('start')
        const elapsedRatio = elapsed / duration
        const radius = easeInOut(elapsedRatio) * 35 + 5
        const opacity = easeInOut(1 - elapsedRatio)
        const fillOpacity = easeInOut(0.5 - elapsedRatio)

        vectorContext.setStyle(createStyle({
          imageRadius: radius,
          fillColor: [119, 170, 203, fillOpacity],
          strokeColor: [119, 170, 203, opacity],
          strokeWidth: 2 + opacity,
        }))

        vectorContext.drawGeometry(flashGeom)
        vectorContext.setStyle(feature.getStyle()(feature)[0])
        vectorContext.drawGeometry(feature.getGeometry())

        if (elapsed > duration) {
          feature.set('start', Date.now())
        }

        this.$refs.map.render()
      },
      onMapMounted () {
        // now ol.Map instance is ready and we can work with it directly
        this.$refs.map.$map.getControls().extend([
          new ScaleLine(),
          new FullScreen(),
          new OverviewMap({
            collapsed: false,
            collapsible: true,
          }),
          new ZoomSlider(),
        ])
      },
      // base layers
      showBaseLayer (name) {
        let layer = this.baseLayers.find(layer => layer.visible)
        if (layer != null) {
          layer.visible = false
        }

        layer = this.baseLayers.find(layer => layer.name === name)
        if (layer != null) {
          layer.visible = true
        }
      },
      // map panel
      mapPanelTabClasses (tab) {
        return {
          'is-active': this.mapPanel.tab === tab,
        }
      },
      showMapPanelLayer (layer) {
        layer.visible = !layer.visible
      },
      showMapPanelTab (tab) {
        this.mapPanel.tab = tab
        if (tab !== 'draw') {
          this.drawType = undefined
        }
      },
      onMapClick (evt) {
        let pixel = evt.pixel
        let features = this.$refs.map.$map.getFeaturesAtPixel(pixel)

        if (!features) {
          this.vtSelection = {}
          // force redraw of layer style
          this.$refs.vtLayer.refresh()
        } else if (features) {
          this.deviceCoordinate = evt.coordinate
          let feature = features[0]
          let fid = feature.get(this.vtIdProp)

          if (this.vtSelectMode === 'single') {
            this.vtSelection = {}
          }
          // add selected feature to lookup
          this.vtSelection[fid] = feature

          let properties = feature.getProperties()
          this.featureID = properties['parno']
          this.parcelValue = properties['parval']
          this.bldgValue = properties['bldg_value']
          this.Props = properties
          // force redraw of layer style
          this.$refs.vtLayer.refresh()
        }
      },
      onMapDoneClick () {
        this.vtSelection = {}
        // force redraw of layer style
        this.$refs.vtLayer.refresh()
      },
    },
  }
</script>

<style lang="sass">
  @import ~bulma/sass/utilities/_all

  html, body, #app
    width: 100%
    height: 100%
    margin: 0
    padding: 0

  .HurricaneFlorence
    position: relative

    .map
      height: 100%
      width: 100%

    .map-panel
      padding: 0

      .panel-heading
        box-shadow: 0 .25em .5em transparentize($dark, 0.8)

      .panel-content
        background: $white
        box-shadow: 0 .25em .5em transparentize($dark, 0.8)

      .panel-block
        &.draw-panel
          .buttons
            .button
              display: block
              flex: 1 1 100%

      +tablet()
        position: absolute
        top: 0
        right: 0
        max-height: 500px
        width: 22em

    .base-layers-panel
      position: absolute
      left: 50%
      bottom: 20px
      transform: translateX(-50%)

    .feature-popup
      position: absolute
      left: -50px
      bottom: 12px
      width: 20em
      max-width: none

      &:after, &:before
        top: 100%
        border: solid transparent
        content: ' '
        height: 0
        width: 0
        position: absolute
        pointer-events: none
      &:after
        border-top-color: white
        border-width: 10px
        left: 48px
        margin-left: -10px
      &:before
        border-top-color: #cccccc
        border-width: 11px
        left: 48px
        margin-left: -11px

      .card-content
        max-height: 20em
        overflow: auto

      .content
        word-break: break-all

</style>
