import styled from 'styled-components'

export const ZoneDataWrapper = styled.div`
  background-color: #333;
  color: #fff;
  border-radius: 3px;
  top: 10px;
  left: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  padding: 10px;
  position: absolute;
  max-width: 400px;
  font-size: 16px;
  line-height: 1.8;

  strong {
    font-size: 14px;
  }

  .color-preview {
    display: flex;

    strong {
      margin-inline-end: 10px;
    }
  }
`
