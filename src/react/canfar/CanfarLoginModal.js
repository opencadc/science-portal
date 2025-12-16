import React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightToBracket } from "@fortawesome/free-solid-svg-icons";

const PASS_RESET_URI = "ivo://cadc.nrc.ca/passreset"
const ACCOUNT_REQUEST_URI = "ivo://cadc.nrc.ca/acctrequest"

class CanfarLoginModal extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      isOpen: props.isOpen,
      modalURLs: props.modalURLs,
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

    let errMsg = ""
    if (this.state.errMsg !== undefined) {
      errMsg = <div className="sp-error-msg"> {this.state.errMsg} </div>
    }

    let hideFormClass = ""

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
            <form className={"access-control " + hideFormClass} id="modalloginForm" role="form" onSubmit={this.props.submitHandler} action={this.state.modalURLs.baseURLCanfar + "/access/login"}>
              <input type="hidden" name="target" value={this.state.modalURLs.baseURLCanfar + "/science-portal"} />
              <div className="modal-body">
                <span id="modal_login_fail" className="text-danger help-block pull-left"></span>
                <div className="form-group">
                  <label htmlFor="username" className="d-none" id="modalUsernameLabel">Username</label>
                  <input type="text" id="modalUsername" name="username" className="form-control"
                         tabIndex="1" required="required"
                         placeholder="CADC Username"/>
                </div>
                <div className="form-group">
                  <label htmlFor="password" className="d-none" id="modalPasswordLabel">Password</label>
                  <input type="password" id="modalPassword" name="password" className="form-control" tabIndex="2"
                         required="required"
                         placeholder="Password"/>
                </div>
                {errMsg}
                <a href={this.state.modalURLs[PASS_RESET_URI]}
                   className="account_access_info"
                   tabIndex="5" title="Forgot Password">
                  Forgot your Account information?</a>
                <br/>
                <a href={this.state.modalURLs[ACCOUNT_REQUEST_URI]}
                   className="account_access_info"
                   tabIndex="6" title="Register" >
                  Request a CADC Account</a>
              </div>
              <div className="modal-footer">
                <Button type="submit" variant="success">
                  <span className="glyphicon glyphicon-log-in">
                    <FontAwesomeIcon  icon={faRightToBracket} />
                  </span>
                Login

                </Button>
              </div>
            </form>
          </Modal.Body>
        </Modal>
      </>
    );
  }
}
export default CanfarLoginModal;