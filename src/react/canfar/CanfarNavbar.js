import React from "react";

import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";

import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faRightFromBracket} from "@fortawesome/free-solid-svg-icons";
import {faCaretDown} from "@fortawesome/free-solid-svg-icons";

const GROUP_MANAGEMENT_URI = "ivo://cadc.nrc.ca/groups"
const ADVANCED_SEARCH_URI = "ivo://cadc.nrc.ca/search"
const ACCOUNT_UPDATE_URI = "ivo://cadc.nrc.ca/acctupdate"
const PASSWORD_CHANGE_URI = "ivo://cadc.nrc.ca/passchg"
const CRED_URI = "ivo://cadc.nrc.ca/cred"

class CanfarNavbar extends React.Component {

    constructor(props) {
      super(props)
      this.state = {
        isAuthenticated: props.isAuthenticated,
        authenticatedUser: props.authenticatedUser,
        headerURLs: props.headerURLs
      }
    }

    // This function allows data to move through and re-render
    // children using this data
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

    renderButton() {
      return (
        <Button size="sm" variant="outline-primary">{this.state.authenticatedUser}<span className="sp-buffer-span-left"><FontAwesomeIcon icon={faCaretDown} /></span></Button>
      )
    }

  renderLoginButton() {
    return (
      <Button size="sm" variant="outline-primary">Login<span className="sp-buffer-span-left"><FontAwesomeIcon icon={faCaretDown} /></span></Button>
    )
  }

    render() {
      const baseURLCanfar = this.state.headerURLs.baseURLCanfar

      var showBanner = false
      if (typeof this.props.bannerText !== "undefined"
        && this.props.bannerText !== "") {
        showBanner = true
      }

      return (
        <div className="canfar-header">
        <Navbar expand="md">
          <Container fluid>
            <Navbar.Brand href={baseURLCanfar}><img src="https://www.canfar.net/css/images/logo.png"></img></Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse className="justify-content-end">
              <Nav className="justify-content-end flex-grow-1 pe-3">
              <Nav.Link href={baseURLCanfar + "/en/docs/quick_start/"}>Documentation</Nav.Link>
              <NavDropdown title="Services">
                <NavDropdown.Item href={baseURLCanfar + "/storage/list"}  target="_blank">Storage Management</NavDropdown.Item>
                <NavDropdown.Item href={this.state.headerURLs[GROUP_MANAGEMENT_URI]} target="_blank">Group Management</NavDropdown.Item>
                <NavDropdown.Item href={baseURLCanfar + "/citation"}  target="_blank">Data Publication</NavDropdown.Item>
                <NavDropdown.Item href={baseURLCanfar + "/science-portal"}  target="_blank">Science Portal</NavDropdown.Item>
                <NavDropdown.Item href={this.state.headerURLs[ADVANCED_SEARCH_URI]} target="_blank">CADC Search</NavDropdown.Item>
                <NavDropdown.Item href="https://arbutus-canfar.cloud.computecanada.ca" target="_blank">OpenStack Cloud</NavDropdown.Item>
              </NavDropdown>
              <Nav.Link href="https://www.opencadc.org/canfar/latest/about/home/">About</Nav.Link>
              <Nav.Link href="https://github.com/opencadc">Open Source</Nav.Link>
              <NavDropdown title="Support">
<<<<<<< HEAD
                <NavDropdown.Item href="mailto:support@canfar.net"  target="_blank">Help</NavDropdown.Item>
                <NavDropdown.Item href={baseURLCanfar + "/slack"} target="_blank">Join us on Slack</NavDropdown.Item>
=======
                <NavDropdown.Item href="mailto:support@canfar.net" target="_blank">Help</NavDropdown.Item>
                <NavDropdown.Item href="https://discord.gg/vcCQ8QBvBa" target="_blank">Join us on Discord</NavDropdown.Item>
>>>>>>> d58259e (fix: doc discord link)
              </NavDropdown>
              </Nav>

              {this.state.isAuthenticated === false &&
              <NavDropdown align="end" title={this.renderLoginButton()} className="sp-auth-dropdown">
                <NavDropdown.Item >
                  {/* For now, a login modal isn't implemented here as there is a blocking modal for login for Science Portal */}
                  {/*<Card alignRight>*/}
                  {/*  <form className="form-inline access-control" id="loginForm" role="form" method="post"*/}
                  {/*        action="/access/login">*/}
                  {/*    <span id="login_fail" className="help-block text-danger pull-left"></span>*/}
                  {/*    <div className="form-group">*/}
                  {/*      <label htmlFor="username" className="hidden" id="usernameLabel">Username</label>*/}
                  {/*      <input type="text" id="username" name="username" className="form-control" tabIndex="1"*/}
                  {/*             required="required"*/}
                  {/*             placeholder="Username"/>*/}
                  {/*    </div>*/}
                  {/*    <div className="form-group">*/}
                  {/*      <label htmlFor="password" className="hidden" id="passwordLabel">Password</label>*/}
                  {/*      <input type="password" id="password" name="password" className="form-control" tabIndex="2"*/}
                  {/*             required="required"*/}
                  {/*             placeholder="Password"/>*/}
                  {/*    </div>*/}
                  {/*    <button type="submit" id="submitLogin" tabIndex="2" className="btn btn-success">*/}
                  {/*      <span className="glyphicon glyphicon-log-in"></span> Login*/}
                  {/*    </button>*/}
                  {/*  </form>*/}
                  {/*  <a href=""*/}
                  {/*     className="account_access_info"*/}
                  {/*     tabIndex="5" title="Forgot Username" id="forgot_username_1">*/}
                  {/*    Forgot your Account information?</a>*/}
                  {/*  /!*<a href=""*!/*/}
                  {/*  /!*   className="account_access_info"*!/*/}
                  {/*  /!*   tabIndex="6" title="Register" id="register_cadc_1">*!/*/}
                  {/*  /!*  Request a CADC Account</a>*!/*/}

                  {/*</Card>*/}
                </NavDropdown.Item>
              </NavDropdown>
              }
              {this.state.isAuthenticated === true &&
                <NavDropdown align="end" title={this.renderButton()} id="authenticated_nav_dropdown" className="sp-auth-dropdown">
                  <NavDropdown.Item href={this.state.headerURLs[ACCOUNT_UPDATE_URI]}  target="_blank">Update Profile</NavDropdown.Item>
                  <NavDropdown.Item href={this.state.headerURLs[PASSWORD_CHANGE_URI]} target="_blank">Reset Password</NavDropdown.Item>
                  <NavDropdown.Item href={this.state.headerURLs[CRED_URI] + "?daysValid=30"}>Obtain Certificate</NavDropdown.Item>
                  <NavDropdown.Item href={baseURLCanfar + "/access/logout?target=" + baseURLCanfar + "/science-portal/"}>
                    <span className="sp-buffer-span-right"><FontAwesomeIcon  icon={faRightFromBracket} /></span>Logout
                  </NavDropdown.Item>
                </NavDropdown>
              }

            </Navbar.Collapse>
          </Container>
        </Navbar>
          {showBanner &&
          <Card className="sp-warning-card">
            <div className="sp-warn-heading"></div>
            <div className="sp-warn-body">
              <p>{this.props.bannerText}</p>
            </div>
          </Card>
          }
          {/*{authModal}*/}
          </div>
      )
    }


}

export default CanfarNavbar;

