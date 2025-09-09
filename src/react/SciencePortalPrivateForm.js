import React from 'react';
import './css/index.css';

import Button from "react-bootstrap/Button";
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Placeholder from 'react-bootstrap/Placeholder';
import Popover from 'react-bootstrap/Popover';

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faQuestionCircle} from "@fortawesome/free-solid-svg-icons";

// Constants
import {DEFAULT_CORES_NUMBER, DEFAULT_RAM_NUMBER, HAS_FIXED} from "./utilities/constants";

class SciencePortalPrivateForm extends React.Component {

  constructor(props) {
    super(props)
    this.selectedRAM = DEFAULT_RAM_NUMBER
    this.selectedCores = DEFAULT_CORES_NUMBER
    this.repositoryUsername = props.authenticatedUsername && props.authenticatedUsername !== "Login" ? props.authenticatedUsername : ""
    if (typeof props.fData.contextData !== "undefined") {
      this.selectedRAM = Math.max(props.fData.contextData?.defaultRAM || DEFAULT_RAM_NUMBER, DEFAULT_RAM_NUMBER)
      this.selectedCores = Math.max(props.fData.contextData?.defaultCores || DEFAULT_CORES_NUMBER, DEFAULT_CORES_NUMBER)
    }

    const repositoryHostArray = props.fData.repositoryHosts

    this.state = {
      fData: props.fData,
      selectedRAM: this.selectedRAM,
      selectedCores: this.selectedCores,
      repositoryUsername: this.repositoryUsername,
      repositoryHost: (repositoryHostArray && repositoryHostArray.length > 0) ? repositoryHostArray[0] : "",
        resourceType: 'shared',
        showRAM: false,
        showCores: false
    }
    this.handleChange = this.handleChange.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.handleImageChange = this.handleImageChange.bind(this);
    this.handleRepositorySecretChange = this.handleRepositorySecretChange.bind(this);
    this.handleRepositoryUsernameChange = this.handleRepositoryUsernameChange.bind(this);
    this.handleResourceTypeChange = this.handleResourceTypeChange.bind(this);
  }

  handleChange(event) {
    // Entire session form state data object needs to be put back
    // into the form on session name input change or the
    // form can't render
    let tmpData = this.state.fData
    tmpData.sessionName = event.target.value
    this.setState({fData: tmpData});
  }

  handleImageChange(event) {
    this.setState({
      image: event.target.value
    })
  }

  handleRepositoryUsernameChange(event) {
    this.setState({
      repositoryUsername: event.target.value
    })
  }

  handleRepositorySecretChange(event) {
    this.setState({
      repositorySecret: event.target.value
    })
  }

  handleRAMChange(event) {
    this.setState({
      selectedRAM: event.target.value
    });
  }

  handleCoresChange(event) {
    this.setState({
      selectedCores: event.target.value
    });
  }

  handleResourceTypeChange(event) {
    const resourceType = event.target.value;
    const isCustom = resourceType === 'custom';
    const ramAndCores = {}
   if (!isCustom) {
      ramAndCores.selectedCores = DEFAULT_CORES_NUMBER
      ramAndCores.selectedRAM = DEFAULT_RAM_NUMBER
    }
    this.setState({
      resourceType: resourceType,
      showRAM: isCustom,
      showCores: isCustom,
      ...ramAndCores
    });
  }

  resetForm(event) {
    event.stopPropagation();
    const formProps = this.props;

    this.setState({
      selectedCores : Math.max(this.props.fData.contextData.defaultCores || DEFAULT_CORES_NUMBER, DEFAULT_CORES_NUMBER),
      selectedRAM : Math.max(this.props.fData.contextData.defaultRAM || DEFAULT_RAM_NUMBER, DEFAULT_RAM_NUMBER),
      repositoryUsername: formProps.authenticatedUsername && formProps.authenticatedUsername !== "Login"
          ? formProps.authenticatedUsername : "",
        resourceType: 'shared',
        showRAM: false,
        showCores: false
    });
    this.state.fData.resetHandler?.();
  }

  static getDerivedStateFromProps(props, state) {
    console.log(`getDerivedStateFromProps()`)
    if (props.fData !== state.fData) {
      console.log(`getDerivedStateFromProps(): OK`)
      return {fData: props.fData}
    } else {
      console.log(`getDerivedStateFromProps(): IGNORING`)
      return null
    }
  }

  componentDidUpdate(nextProps) {
    console.log('componentDidUpdate()')
    if (this.props.fData !== nextProps.fData) {
      console.log(`componentDidUpdate(): OK`)
        const canHaveFixed = HAS_FIXED.includes(this.state.fData?.selectedType)
        let newState = {
            fData: nextProps.fData
        }
        if (!canHaveFixed) {
            newState = {
                ...newState,
                resourceType: 'shared',
                showRAM: false,
                showCores: false
            }
        }
        this.setState({
        ...newState,
      });
    } else {
      console.log(`componentDidUpdate(): IGNORING`)
    }
  }

  renderPopover(headerText, bodyText) {
    const overlayKey = `${headerText.toLowerCase().replace(/\s+/g, '-')}-popover-overlay`
    return <OverlayTrigger
      trigger="click"
      key={overlayKey}
      placement="top"
      rootClose={true}
        overlay={
          <Popover id={`popover-positioned-top`}>
            <Popover.Header as="h3">{headerText}</Popover.Header>
            <Popover.Body className="sp-form">
              {bodyText}
            </Popover.Body>
          </Popover>
        }
      >
        <FontAwesomeIcon className="sp-form-cursor popover-blue" icon={faQuestionCircle} />
      </OverlayTrigger>
  }

  renderPlaceholder() {
    return (
        <Col md={6}>
          <Placeholder className="sp-form-p" as="p" animation="glow">
            <Placeholder className="sp-form-placeholder" bg="secondary" md={12} sz="sm" />
          </Placeholder>
        </Col>
    );
  }

  render() {
      const canHaveFixed = HAS_FIXED.includes(this.state.fData?.selectedType)
      const repositoryHostComponent = this.state.fData.repositoryHosts.length > 1
        ? <Form.Select
            name="repositoryHost"
            size="sm"
            className="sp-form-cursor sp-form-input"
          >
            {this.state.fData.repositoryHosts?.map(mapObj => (
                <option className="sp-form" key={mapObj} name={mapObj} value={mapObj}>{mapObj}</option>
            ))}
          </Form.Select>
        : <Form.Control
            type="text"
            disabled={true}
            defaultValue={this.state.repositoryHost}
            name="repositoryHost"
            className="sp-form-input"
        />

    return (
      <>
        {Object.keys(this.state.fData).length !== 0 && 
          <Form onSubmit={this.state.fData.submitHandler} className="sp-form">
            <fieldset className="mt-3">
              <div className="ps-4 pe-4 pt-4 w-75">
                <legend className="fs-6">Image access</legend>
                <hr />
              </div>
              <Row className="sp-form-row">
                <Col sm={4}>
                  <Form.Label className="sp-form-label" column="sm">container image
                    {this.renderPopover("Container Image","The full Docker image URI for the session.")}
                  </Form.Label>
                </Col>
                <Col sm={3} className={"pe-1"}>
                  {repositoryHostComponent}
                </Col>
                <Col sm={4} className={"ps-1"}>
                  <Form.Control
                      type="text"
                      placeholder="project/example-image:1.0.0"
                      value={this.state.image}
                      onChange={this.handleImageChange}
                      name="image"
                      className="sp-form-input"
                  />
                </Col>
              </Row>
              <Row className="sp-form-row">
                <Col sm={4}>
                  <Form.Label className="sp-form-label" column="sm">repository username
                    {this.renderPopover("Image repository username","The username for authenticated access to the Image Repository.")}
                  </Form.Label>
                </Col>
                <Col sm={7}>
                  <Form.Control
                      type="text"
                      placeholder="Repository username"
                      value={this.state.repositoryUsername}
                      onChange={this.handleRepositoryUsernameChange}
                      name="repositoryAuthUsername"
                      className="sp-form-input"
                  />
                </Col>
              </Row>
              <Row className="sp-form-row">
                <Col sm={4}>
                  <Form.Label className="sp-form-label" column="sm">repository secret
                    {this.renderPopover("Image repository secret","The secret for authenticated access to the Image Repository.")}
                  </Form.Label>
                </Col>
                <Col sm={7}>
                  <Form.Control
                      type="password"
                      placeholder="Repository secret"
                      value={this.state.fData.repositorySecret}
                      onChange={this.handleRepositorySecretChange}
                      name="repositoryAuthSecret"
                      className="sp-form-input"
                  />
                </Col>
              </Row>
            </fieldset>
            <fieldset>
              <div className="ps-4 pe-4 pt-4 w-75">
                <legend className="fs-6">Launch session</legend>
                <hr/>
              </div>
              <Row className="sp-form-row">
                <Col sm={4}>
                  <Form.Label className="sp-form-label" column="sm">type
                    {this.renderPopover("Session Type", "Pick from the list of supported session types")}
                  </Form.Label>
                </Col>
                <Col sm={7}>
                  <Form.Select
                      value={this.state.fData.selectedType}
                      onChange={this.state.fData.changeTypeHandler}
                      name="type"
                      size="sm"
                      className="sp-form-cursor"
                  >
                    {this.state.fData.types?.map(mapObj => (
                        <option className="sp-form" key={mapObj} name={mapObj} value={mapObj}>{mapObj}</option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
              <Row className="sp-form-row">
                <Col sm={4}>
                  <Form.Label className="sp-form-label" column="sm">session name
                    {this.renderPopover("Session Name", "Name for the session. Alphanumeric and '-' characters only.")}
                  </Form.Label>
                </Col>
                <Col sm={7}>
                  <Form.Control
                      type="text"
                      maxLength={15}
                      placeholder="Enter session name"
                      value={this.state.fData.sessionName}
                      onChange={this.handleChange}
                      name="name"
                      className="sp-form-input"
                  />
                </Col>
              </Row>
                {canHaveFixed && (<Row className="sp-form-row radio-res d-flex align-items-center">
                    <Col sm={4}>
                        <Form.Label className="sp-form-label" column="sm">resources</Form.Label>
                    </Col>
                    <Col sm={7} >
                        <Form.Check
                            type="radio"
                            id="resource-shared"
                            name="resourceType"
                            label="Flexible"
                            value="shared"
                            checked={this.state.resourceType === 'shared'}
                            onChange={this.handleResourceTypeChange}
                            inline
                        />{this.renderPopover("Flexible", "Variable access to shared node resources as needed. Jobs can dynamically use shared node resources as needed, with up to 8 CPU cores and 32 GB of RAM available.")}

                        <Form.Check
                            type="radio"
                            id="resource-custom"
                            name="resourceType"
                            label="Fixed"
                            value="custom"
                            checked={this.state.resourceType === 'custom'}
                            onChange={(e) => canHaveFixed ? this.handleResourceTypeChange(e) : null }
                            disabled={!canHaveFixed}
                            inline
                        />{this.renderPopover("Fixed", "Guaranteed dedicated resources that may be harder to allocate, especially for large memory and/or cores.")}
                    </Col>
                </Row>)}
                {this.state.showRAM === true && this.state.showCores === true && canHaveFixed &&
                    <Row className="sp-form-row">
                        <Col sm={4}>
                            {' '}
                        </Col>
                        <Col sm={7}>
                            <Row>
                                <Col sm={6}>
                                    <Form.Label className="sp-form-sublabel">Memory (GB)</Form.Label>
                                    <Form.Select
                                        value={this.state.selectedRAM || this.state.fData?.contextData?.defaultRAM || DEFAULT_RAM_NUMBER}
                                        name="ram"
                                        className="sp-form-cursor"
                                        onChange={this.handleRAMChange.bind(this)}>
                                        {(this.state.fData?.contextData?.availableRAM || []).map(mapObj => (
                                            <option key={mapObj} value={mapObj}>{mapObj}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col sm={6}>
                                    <Form.Label className="sp-form-sublabel">CPU Cores</Form.Label>
                                    <Form.Select
                                        name="cores"
                                        className="sp-form-cursor"
                                        value={this.state.selectedCores || this.state.fData?.contextData?.defaultCores || DEFAULT_CORES_NUMBER}
                                        onChange={this.handleCoresChange.bind(this)}>
                                        {(this.state.fData?.contextData?.availableCores || []).map(mapObj => (
                                            <option key={mapObj} value={mapObj}>{mapObj}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                }
              <Row className="sp-form-row">
                <Col sm={4}>
                  {/* placeholder column so buttons line up with form entry elements */}
                </Col>
                <Col sm={7}>
                  <Button variant="primary" type="submit" size="sm" className="sp-form-button">Launch</Button>
                  <Button variant="secondary" size="sm" onClick={this.resetForm}
                          className="sp-reset-button">Reset</Button>
                </Col>
              </Row>
            </fieldset>
          </Form>
        }

        {(Object.keys(this.state.fData).length === 0) &&
            <Form className="sp-form">
              <Row className="sp-form-row">
              <Col className="sp-placeholder" sm={3}>
                <Form.Label  className="sp-form-label" column="sm">type
                  {this.renderPopover("Session Type","Select from the list of supported session types")}
                </Form.Label>
              </Col>
              {this.renderPlaceholder()}
            </Row>
            <Row className="sp-form-row">
              <Col className="sp-placeholder" sm={3}>
                <Form.Label  className="sp-form-label" column="sm">container image
                  {this.renderPopover("Container Image","Reference to an image to use to start the session container")}
                </Form.Label>
              </Col>
              {this.renderPlaceholder()}
            </Row>
            <Row className="sp-form-row">
              <Col className="sp-placeholder" sm={3}>
                <Form.Label className="sp-form-label" column="sm">session name
                  {this.renderPopover("Session Name","Name for the session. Default name reflects the current number of sessions of the selected type.\n" +
                    "Alphanumeric characters only. 15 character maximum.")}
                </Form.Label>
              </Col>
              {this.renderPlaceholder()}
            </Row>
            <Row className="sp-form-row">
              <Col className="sp-placeholder" sm={3}>
                <Form.Label  className="sp-form-label" column="sm">memory
                  {this.renderPopover("Memory","System memory (RAM) to be used for the session. Default: 16G")}
                </Form.Label>
              </Col>
              {this.renderPlaceholder()}
            </Row>
            <Row className="sp-form-row">
              <Col className="sp-placeholder" sm={3}>
                <Form.Label  className="sp-form-label" column="sm"># cores
                  {this.renderPopover("# of Cores","Number of cores used by the session. Default: 2")}
                </Form.Label>
              </Col>
              {this.renderPlaceholder()}
            </Row>

            <Row className="sp-form-row">
              <Col sm={3}>
                {/* placeholder column so buttons line up with form entry elements */}
              </Col>
              <Col className="sp-button-placeholder-row" md={6}>
                <Placeholder.Button className="sp-button-placeholder" bg="secondary"  aria-hidden="true" animation="glow" />
                <Placeholder.Button className="sp-button-placeholder" bg="secondary"  aria-hidden="true" animation="glow" />
              </Col>
            </Row>
         </Form>
        }
      </>

    )
  }
}

export default SciencePortalPrivateForm;