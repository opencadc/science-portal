import React from "react";

import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Navbar from "react-bootstrap/Navbar";


class SRCNavbar extends React.Component {

    constructor(props) {
      super(props)
      this.state = {
        isAuthenticated: props.isAuthenticated,
        authenticatedUser: props.authenticatedUser,
        themeConfig: props.themeConfig
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

    render() {
      const showBanner = typeof this.props.bannerText !== "undefined" && this.props.bannerText !== ""
      const logoURL = this.state.themeConfig.logoURL ? this.state.themeConfig.logoURL : "/science-portal/images/SRCNetLogo.png"
      return (
        <div className="canfar-header">
        <Navbar expand="md">
          <Container fluid>
            <Navbar.Brand><img alt="SRCNet Logo" src={logoURL} style={{maxWidth: 256 + 'px'}}></img></Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
              {this.state.isAuthenticated === true &&
                <span className="display-name" align="end">{this.state.authenticatedUser}</span>
              }
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
          </div>
      )
    }
}

export default SRCNavbar;



