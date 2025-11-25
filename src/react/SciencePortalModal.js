import React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Spinner from "react-bootstrap/Spinner"

class SciencePortalModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      modalData: props.modalData
    }
    this.baseURLCanfar = props.baseURLCanfar
  }

  handleClose() {
    this.setState({isOpen: false});
  }

  static getDerivedStateFromProps(nextProps, _prevState) {
    return { modalData: nextProps.modalData };
  }

  componentDidUpdate(nextProps) {
    if (this.props.modalData !== nextProps.modalData) {
      this.setState({
        modalData: nextProps.modalData
      });
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  openModal = () => this.setState({modalData: {"isOpen": true}});
  closeModal = () => this.setState({modalData: {"isOpen": false}});

  render() {
    var show = false
    if (this.state.modalData.isOpen === true) {
      show = true
    } else {
      show = false
    }

    var modalMsg = ""
    if (this.state.modalData.msg !== undefined) {
      modalMsg = this.state.modalData.msg
    }
    var modalTitle = ""
    if (this.state.modalData.title !== undefined) {
      modalTitle = this.state.modalData.title
    }
    var showSpinner = false
    if (this.state.modalData.showSpinner !== undefined) {
      showSpinner = this.state.modalData.showSpinner
    }
    var showReload = false
    if (this.state.modalData.showReload !== undefined) {
      showReload = this.state.modalData.showReload
    }
    var showHome = false
    if (this.state.modalData.showHome !== undefined) {
      showHome = this.state.modalData.showHome
    }
    var showClose = false
    if (this.state.modalData.showClose !== undefined) {
      showClose = this.state.modalData.showClose
    }
    var canfarURL = ""
    if (this.state.baseURLcanfar !== undefined) {
      canfarURL = this.state.baseURLcanfar
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
            <Modal.Title>{modalTitle}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalMsg}
            <span className="spinner-span">{showSpinner === true && <Spinner animation="border" variant="primary" size="sm"/> }</span>

            <div id="infoHome" className="sp-modal-footer-info-link">
              {showHome === true && <a href={canfarURL} className="account_access_info" title="CANFARHome" target="_blank">
                Science Platform Home</a>}
            </div>

          </Modal.Body>
          <Modal.Footer>
            {showClose === true && <Button variant="secondary" onClick={this.closeModal}>
              Close
            </Button>
            }
            {showReload === true && <Button className="sp-e-reload" id="pageReloadButton" onClick={this.handleReload}>Reload Portal</Button>}
          </Modal.Footer>
        </Modal>
      </>
    )
  }
}

export default SciencePortalModal;