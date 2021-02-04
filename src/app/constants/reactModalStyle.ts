export const reactModalDefaultStyle: ReactModal.Styles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 9,
  },
  content: {
    margin: '0 auto',
    height: 'max-content',
    maxHeight: '90vh',
    width: 'fit-content',
    maxWidth: '100%',
    top: '50%',
    transform: 'translate(0, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
}
