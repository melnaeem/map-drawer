import styled from 'styled-components'

export const MapWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;

  .mapboxgl-ctrl-group button.active,
  .mapboxgl-ctrl-group button.active:hover,
  .mapboxgl-ctrl-group button:hover {
    background-color: #ddd;
  }
`
