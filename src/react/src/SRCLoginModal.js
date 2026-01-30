import React from "react";
import Modal from "react-bootstrap/Modal";


class SRCLoginModal extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      isOpen: props.isOpen,
      themeConfig: props.themeConfig
    }
  }

  static getDerivedStateFromProps(nextProps, _prevState) {
    return nextProps;
  }

  componentDidUpdate(nextProps) {
    if (this.props !== nextProps) {
      this.setState({
        nextProps
      });
    }
  }

  closeModal = () => this.setState({ isOpen: false });

  render() {
    let show = false
    if (this.state.isOpen === true) {
      show = true
    }

    return (
      <>
        <Modal
          show={show}
          onHide={this.closeModal}
          backdrop="static"
          keyboard={false}
        >
          <Modal.Header>
            <Modal.Title className="sp-modal-header">Authentication required</Modal.Title>
          </Modal.Header>
          <Modal.Body className="sp-auth-form-body">
            <a className="btn btn-primary" href="/science-portal/oidc-login">Sign In to OpenID Connect</a>
          </Modal.Body>
        </Modal>
      </>
    );
  }
}
export default SRCLoginModal;