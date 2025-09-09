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

// Utils
import {getProjectImagesMap, getProjectNames} from "./utilities/utils";
import {
  DEFAULT_CORES_NUMBER, DEFAULT_IMAGE_NAMES,
  DEFAULT_RAM_NUMBER, SKAHA_PROJECT
} from "./utilities/constants";

class SciencePortalForm extends React.Component {

  constructor(props) {
    super(props)
    this.selectedRAM = DEFAULT_RAM_NUMBER
    this.selectedCores = DEFAULT_CORES_NUMBER
    if (typeof props.fData.contextData !== "undefined") {
      this.selectedRAM = Math.max(props.fData.contextData?.defaultRAM || DEFAULT_RAM_NUMBER, DEFAULT_RAM_NUMBER)
      this.selectedCores = Math.max(props.fData.contextData?.defaultCores || DEFAULT_CORES_NUMBER, DEFAULT_CORES_NUMBER)
    }
    this.state = {
      fData:props.fData,
      selectedRAM: this.selectedRAM,
      selectedCores: this.selectedCores,
      selectedProject: undefined,
      selectedImageId: undefined,
      resourceType: 'shared',
      showRAM: false,
      showCores: false
    }
    this.handleChange = this.handleChange.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.renderPopover = this.renderPopover.bind(this);
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

    this.setState({
      selectedCores : Math.max(this.props.fData.contextData?.defaultCores || DEFAULT_CORES_NUMBER, DEFAULT_CORES_NUMBER),
      selectedRAM : Math.max(this.props.fData.contextData?.defaultRAM || DEFAULT_RAM_NUMBER, DEFAULT_RAM_NUMBER),
      selectedProject: '',
      selectedImageId: '',
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
      this.setState({
        fData: nextProps.fData
      });
    } else {
      console.log(`componentDidUpdate(): IGNORING`)
    }
  }

  renderPopover(headerText, bodyText) {
    return <OverlayTrigger
      trigger="click"
      key="top"
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
    const projectsOfType = getProjectImagesMap(this.state.fData?.imageList)
    const availableProjects = getProjectNames(projectsOfType) || []
    const defaultImages =  projectsOfType?.[SKAHA_PROJECT] || []
    const imagesOfProject = this.state.selectedProject ? projectsOfType?.[this.state.selectedProject] : defaultImages
    const defaultImageName = this.state.fData?.selectedType ? DEFAULT_IMAGE_NAMES[this.state.fData.selectedType] : undefined
    const defaultImageId = defaultImageName ? imagesOfProject?.find(mObj => mObj.name === defaultImageName)?.id : imagesOfProject?.[0]?.id

      return (
      <>
        {Object.keys(this.state.fData || {}).length !== 0 && 
         this.state.fData?.imageList && 
          <Form onSubmit={this.state.fData?.submitHandler} className="sp-form">
            <Row className="sp-form-row">
              <Col sm={4}>
                <Form.Label className="sp-form-label" column="sm">type
                  {this.renderPopover("Session Type","Select from the list of supported session types")}
                </Form.Label>
              </Col>
              <Col sm={7}>
                <Form.Select
                  value={this.state.fData?.selectedType || ''}
                  onChange={this.state.fData?.changeTypeHandler}
                  name="type"
                  size="sm"
                  className="sp-form-cursor"
                >
                  {(this.state.fData?.types || []).map(mapObj => (
                    <option className="sp-form" key={mapObj} name={mapObj} value={mapObj}>{mapObj}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
            <Row className="sp-form-row">
              <Col sm={4}>
                <Form.Label className="sp-form-label" column="sm">project
                  {this.renderPopover("Image Project","The project for which the image is used. Default: Use the Skaha project to access the default CANFAR image list.")}
                </Form.Label>
              </Col>
              <Col sm={7}>
                <Form.Select
                    name="project"
                    className="sp-form-cursor"
                    onChange={(e) => this.setState({selectedProject: e.target.value || undefined})}
                    value={this.state.selectedProject || SKAHA_PROJECT}
                >
                  <option className="sp-form" value="">Select project</option>
                  {availableProjects?.map(project => (
                      <option className="sp-form" key={project} value={project}>{project}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
            <Row className="sp-form-row">
              <Col sm={4}>
                <Form.Label className="sp-form-label" column="sm">container image
                  {this.renderPopover("Container Image","The Docker image for the session.")}
                </Form.Label>
              </Col>
              <Col sm={7}>
                <Form.Select
                    name="image"
                    className="sp-form-cursor"
                    onChange={(e) => this.setState({selectedImageId: e.target.value || undefined})}
                    value={this.state.selectedImageId || defaultImageId}
                >
                  {imagesOfProject?.map(mapObj => (
                      <option className="sp-form" key={mapObj.id} value={mapObj.id}>{mapObj.name}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
            <Row className="sp-form-row">
              <Col sm={4}>
                <Form.Label className="sp-form-label" column="sm">session name
                  {this.renderPopover("Session Name","Name for the session. Alphanumeric and '-' characters only.")}
                </Form.Label>
              </Col>
              <Col sm={7}>
                  <Form.Control
                    type="text"
                    maxLength={15}
                    placeholder="Enter session name"
                    value={this.state.fData?.sessionName || ''}
                    onChange={this.handleChange}
                    name="name"
                    className="sp-form-input"
                  />
              </Col>
            </Row>

            <Row className="sp-form-row radio-res d-flex align-items-center">
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
                />{this.renderPopover("Flexible", "Variable access to shared node resources as needed.")}

                <Form.Check
                  type="radio"
                  id="resource-custom"
                  name="resourceType"
                  label="Fixed"
                  value="custom"
                  checked={this.state.resourceType === 'custom'}
                  onChange={this.handleResourceTypeChange}
                  inline
                />{this.renderPopover("Fixed", "Guaranteed dedicated resources that may be harder to allocate, especially for large memory and/or cores.")}
              </Col>
            </Row>
            {this.state.showRAM === true && this.state.showCores === true &&
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
                <Button variant="primary" type="submit"  size="sm" className="sp-form-button">Launch</Button>
                <Button variant="secondary" size="sm" onClick={this.resetForm} className="sp-reset-button">Reset</Button>
              </Col>
            </Row>
          </Form>
        }

        {(Object.keys(this.state.fData || {}).length === 0 || !this.state.fData?.imageList) && 
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
                <Form.Label  className="sp-form-label" column="sm">project
                  {this.renderPopover("Image Project","The project for which the image is used.")}
                </Form.Label>
              </Col>
              {this.renderPlaceholder()}
            </Row>
            <Row className="sp-form-row">
              <Col className="sp-placeholder" sm={3}>
                <Form.Label  className="sp-form-label" column="sm">container image
                  {this.renderPopover("Container Image","Reference to an image to use to start the session container. Default: use skaha project access the default CANFAR image list.")}
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
                  {this.renderPopover("Memory","System memory (RAM) to be used for the session.")}
                </Form.Label>
              </Col>
              {this.renderPlaceholder()}
            </Row>
            <Row className="sp-form-row">
              <Col className="sp-placeholder" sm={3}>
                <Form.Label  className="sp-form-label" column="sm"># cores
                  {this.renderPopover("# of Cores","Number of cores used by the session.")}
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

export default SciencePortalForm;