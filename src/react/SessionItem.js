import React from 'react';
import Badge from 'react-bootstrap/Badge'
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col';
import Placeholder from 'react-bootstrap/Placeholder';
import Row from 'react-bootstrap/Row';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons/faTrashAlt'
import { faClock } from '@fortawesome/free-solid-svg-icons'
import { faFlag } from '@fortawesome/free-solid-svg-icons'
import { faFileLines } from '@fortawesome/free-solid-svg-icons'

import './css/index.css';
import './sp-session-list.css';
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Spinner from "react-bootstrap/Spinner";

function SessionItem(props) {

  // Set up badging colours
  var bgClass = ""
  var showSpinner = false

  var uberCSS = ""
  var cardCSS = "sp-e-session-card"
  var connectCSS = "sp-e-session-connect"
  var alwaysAvailableCSS = "sp-card-text sp-session-button"
  var hiddenPendingCSS = "sp-card-text sp-session-button"
  var displayGPU = true
  let displayCores;
  let displayMemory;

  if (props.listType === "list") {
    if (props.sessData.status === "Running") {
      bgClass = "success"
    } else if (props.sessData.status === "Pending") {
      // Set CSS and control for pending state, to block
      // cursor events and show progress cursor when
      // item is hovered over
      bgClass = "secondary"
      var pendingCSS = " sp-pending"
      showSpinner = true
      cardCSS = cardCSS + pendingCSS
      connectCSS = connectCSS + pendingCSS
      hiddenPendingCSS = hiddenPendingCSS + pendingCSS
      uberCSS = "sp-pending-cursor"
    } else {
      bgClass = "secondary"
    }

    if ((props.sessData.requestedGPUCores === "<none>") ||
        (props.sessData.requestedGPUCores === "0") ) {
      displayGPU = false
    }


    if (props.sessData.isFixedResources === true) {
      displayCores = `${props.sessData.coresInUse ?? ""} / ${props.sessData.requestedCPUCores}`
      displayMemory = `${props.sessData.ramInUse ?? ""} / ${props.sessData.requestedRAM}`
    } else {
      displayCores = props.sessData.coresInUse
      displayMemory = props.sessData.ramInUse
    }
  }

  return (
    <>
      {props.listType === "list" &&
      <Card className={uberCSS}>
        <Card.Body className={cardCSS}>
          <div className={connectCSS}
            onClick={props.sessData.connectHandler}
            data-connecturl={props.sessData.connectURL}>
            <Row><Col>
              <Card.Header className="sp-float-left-full">
                <img className="sp-icon-img" src={props.sessData.logo} alt={props.sessData.altText}></img>
                <span className="sp-session-name">{props.sessData.name}</span>
              </Card.Header>
            </Col></Row>
            <Row><Col>
              <div className="sp-card-pill sp-card-text">
                {/* For next pass */}
                {/*<Badge pill bg="warning">Expiring Soon</Badge>*/}
                <span className="sp-session-spinner">{showSpinner === true && <Spinner animation="border" variant="primary" size="sm"/> }</span>

                <Badge pill bg={bgClass}>{props.sessData.status}</Badge>
              </div>
            </Col></Row>
            <Row className="sp-card-group-top"><Col>
              <div className="sp-card-text">
               <span className="sp-card-text-data">{props.sessData.image}</span>
              </div>
              {/*<br/>*/}

            </Col></Row>
            <Row className="sp-card-group-top"><Col>
              <div className="sp-card-text">
                <span className="sp-card-text-label">started:</span>
                <span className="sp-card-text-data">{props.sessData.startTime}</span> UTC
              </div>
              {/*<br/>*/}
            </Col></Row>
            <Row className="sp-card-group-middle"><Col>
              <div className="sp-card-text">
                <span className="sp-card-text-label">expires:</span>
                <span className="sp-card-text-data">{props.sessData.expiryTime}</span> UTC
              </div>
              <br/>
            </Col></Row>
            <Row className="sp-card-group-top">
              <Col>
                <div className="sp-card-text">
                  <span className="sp-card-text-label">memory:</span>
                  <span className="sp-card-text-data">{displayMemory}  GB</span>
                </div>
            </Col>
          </Row>
          <Row className="sp-card-group-middle"><Col>
              <div className="sp-card-text">
                <span className="sp-card-text-label">CPU cores:</span>
                <span className="sp-card-text-data">{displayCores}</span>
              </div>
          </Col></Row>
            {displayGPU === true &&
              <>
                <Row className="sp-card-group-top">
                  <Col>
                    <div className="sp-card-text">
                      <span className="sp-card-text-label">GPU memory: </span>
                      <span className="sp-card-text-data">{props.sessData.gpuRAMInUse}</span>
                    </div>
                  </Col>
                </Row>
                <Row className="sp-card-group-middle">
                  <Col>
                    <div className="sp-card-text">
                      <span className="sp-card-text-label">GPU cores:</span>
                      <span className="sp-card-text-data">{props.sessData.requestedGPUCores}</span>
                    </div>
                  </Col>
                </Row>
                <Row className="sp-card-group-middle">
                  <Col>
                    <div className="sp-card-text">
                      <span className="sp-card-text-label">GPU utilization: </span>
                      <span className="sp-card-text-data">{props.sessData.gpuUtilization}</span>
                    </div>
                  </Col>
                </Row>
              </>
            }

          {/*  End of the connectCSS area, used for event handling */}
          </div>
        </Card.Body>
        <Card.Footer>
          <Row><Col>
            <div className="sp-card-button">
                <span className="sp-card-button-span">
                  <OverlayTrigger
                    key="delete-session-overlay-tooltip"
                    placement="top"
                    className="sp-b-tooltip"
                    overlay={
                      <Tooltip className="sp-b-tooltip">
                        delete session
                      </Tooltip>
                    }>
                    <FontAwesomeIcon
                      onClick={props.sessData.deleteHandler}
                      data-id={props.sessData.id}
                      data-name={props.sessData.name}
                      className={alwaysAvailableCSS}
                      icon={faTrashAlt}/>
                  </OverlayTrigger>
                </span>

              <span className="sp-card-button-span">
                <a href={props.sessData.viewEventsURL} target="_blank">
                  <OverlayTrigger
                      key="view-session-launch-info-overlay-tooltip"
                      placement="top"
                      className="sp-b-tooltip"
                      overlay={
                        <Tooltip className="sp-b-tooltip">
                          view launch info
                        </Tooltip>
                      }>
                      <FontAwesomeIcon
                          className={alwaysAvailableCSS}
                          icon={faFlag}/>
                  </OverlayTrigger>
                </a>
              </span>

              <span className="sp-card-button-span">
                <a href={props.sessData.viewLogsURL} target="_blank">
                  <OverlayTrigger
                    key="view-session-logs-overlay-tooltip"
                    placement="top"
                    className="sp-b-tooltip"
                    overlay={
                      <Tooltip className="sp-b-tooltip">
                        view session logs
                      </Tooltip>
                    }>
                      <FontAwesomeIcon
                          className={alwaysAvailableCSS}
                          icon={faFileLines}/>
                    </OverlayTrigger>
                  </a>
              </span>
              <span className="sp-card-button-span">
                <OverlayTrigger
                    key="renew-session-overlay-tooltip"
                    placement="top"
                    className="sp-b-tooltip"
                    overlay={
                      <Tooltip className="sp-b-tooltip">
                        renew session
                      </Tooltip>
                    }>
                  <FontAwesomeIcon
                      onClick={props.sessData.renewHandler}
                      data-id={props.sessData.id}
                      className={hiddenPendingCSS}
                      icon={faClock}/>
                </OverlayTrigger>
              </span>
              </div>
          </Col></Row>
        </Card.Footer>

      </Card>
      }
      {props.listType === "loading" &&
        <>
          <Card>
            <Card.Body>
              <Row className="sp-title-placeholder"><Col>
                <Placeholder className="sp-form-p" as={Card.Header} animation="glow">
                  <Placeholder className="sp-form-placeholder" xs={12} />
                </Placeholder>
              </Col></Row>

              <Placeholder className="sp-form-p"  as={Card.Text} animation="glow">
                <Placeholder className="sp-form-placeholder sp-card-placeholder" xs={12} />
                <Placeholder className="sp-form-placeholder sp-card-placeholder" xs={12} />{" "}
                <Placeholder className="sp-form-placeholder sp-card-placeholder" xs={12} /> {" "}
                <Placeholder className="sp-form-placeholder sp-card-placeholder" xs={12} /> {" "}
              </Placeholder>

            </Card.Body>
            <Card.Footer>
              <Placeholder className="sp-form-p"  as={Card.Text} animation="glow">
                <Placeholder className="sp-form-placeholder sp-card-placeholder" xs={12} />
              </Placeholder>
            </Card.Footer>
          </Card>
        </>
      }
      {props.listType === "empty" &&
      <>
        <Card className="sp-emptylist-card">
          <Card.Body>
            <Row ><Col>
              <Card.Title>
                <em>No interactive sessions found</em>
              </Card.Title>
            </Col></Row>
          </Card.Body>
        </Card>
      </>
      }
      </>
);
}

export default SessionItem;
