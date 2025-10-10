import React, { useEffect, useState, useMemo } from "react";
import {
  Col,
  Row,
  Card,
  Placeholder,
  ProgressBar,
  OverlayTrigger,
  Popover,
  Tooltip,
  Button,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRefresh, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import "./css/index.css";
import "./sp-session-list.css";
import { parseVospaceXML } from "./utilities/parseVospaceXML";
import Alert from "react-bootstrap/Alert";

/**
 * SciencePortalUserStorage component displays user home storage information.
 * This is considered Experimental and may change in future releases.
 */

const TEST_DATA = {
  size: 11281596360,
  quota: 200000000000,
  date: "Jun 11, 2025, 11:27:58 PM PDT",
  usage: 94,
};

// Optimized file size formatter
const convertToFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const thresh = 1024;
  if (Math.abs(bytes) < thresh) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB", "PB"];
  let u = -1;
  let size = bytes;

  do {
    size /= thresh;
    ++u;
  } while (Math.abs(size) >= thresh && u < units.length - 1);

  return `${size.toFixed(size < 10 ? 2 : 1)} ${units[u]}`;
};

// Format date for UTC display
const formatDateUTC = (dateString) => {
  if (!dateString) return "Unknown";
  try {
    const date = new Date(dateString);
    return date
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, " UTC");
  } catch {
    return "Unknown";
  }
};

// Storage Card Component
const StorageCard = ({ label, value, isLoading }) => {
  const isOverQuota = label === "Usage" && Number(value.split("%")[0] > 90);
  return (
    <Col md={12} className="mb-2">
      <Card className="h-100 shadow-sm rounded-4 text-center">
        <Card.Body className={"p-2"}>
          {isLoading || !value ? (
            <Placeholder className="sp-form-p" as="p" animation="glow">
              <Placeholder
                className="sp-form-placeholder"
                bg="secondary"
                md={8}
                sz="sm"
              />
            </Placeholder>
          ) : (
            <div className="text-dark fw-bold">
              {label}:{" "}
              <span
                className={
                  label === "Usage" && isOverQuota
                    ? "text-danger"
                    : "text-primary"
                }
              >
                {value}
              </span>
            </div>
          )}
        </Card.Body>
      </Card>
    </Col>
  );
};

function SciencePortalUserStorage({ isAuthenticated, name, storageUrl }) {
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Card configuration mapped to data keys
  const cardConfigs = [
    { key: "size", label: "Used", formatter: convertToFileSize },
    { key: "quota", label: "Quota", formatter: convertToFileSize },
    {
      key: "usage",
      label: "Usage",
      formatter: (val) => `${(val || 0).toFixed(1)}%`,
    },
  ];

  // Memoized calculations
  const cardData = useMemo(() => {
    return cardConfigs.map((config) => ({
      label: config.label,
      value: config.formatter(data?.[config.key]),
    }));
  }, [data]);

  const lastUpdate = useMemo(() => {
    return data?.date ? formatDateUTC(data.date) : null;
  }, [data?.date]);

  const fetchStorageData = async () => {
    setFetching(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${storageUrl}${name}`, {
        headers: { Accept: "application/xml" },
        credentials: "include",
      });

      if (!response.ok) {
        setErrorMessage(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlString = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlString, "text/xml");

      const parsedData = parseVospaceXML(xml);
      setData(parsedData);
    } catch (err) {
      console.error("Storage data fetch error:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleRefresh = () => {
    if (name && name !== "Login") {
      fetchStorageData();
    }
  };

  useEffect(() => {
    if (!isAuthenticated || name === "Login") return;
    fetchStorageData();
  }, [isAuthenticated, name]);

  return (
    <>
      {errorMessage ? (
        <Alert variant={"danger"}>
          <span>{errorMessage}</span>
        </Alert>
      ) : null}
      {/* Header with title and controls */}
      <Col>
        <Row>
          <div className="sp-title sp-panel-heading">
            User Home Storage
            <OverlayTrigger
              trigger="click"
              key="info"
              placement="top"
              rootClose={true}
              overlay={
                <Popover id="popover-user-storage-info">
                  <Popover.Header as="h3">User Home Storage</Popover.Header>
                  <Popover.Body className="sp-form">
                    You won't be able to start a new session if your home folder
                    storage is full.
                  </Popover.Body>
                </Popover>
              }
            >
              <FontAwesomeIcon
                className="sp-form-cursor popover-blue"
                icon={faQuestionCircle}
              />
            </OverlayTrigger>
            <span className="sp-header-button">
              <OverlayTrigger
                key="refresh"
                placement="top"
                className="sp-b-tooltip"
                overlay={
                  <Tooltip className="sp-b-tooltip">Refresh storage</Tooltip>
                }
              >
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={handleRefresh}
                >
                  <FontAwesomeIcon icon={faRefresh} />
                </Button>
              </OverlayTrigger>
            </span>
          </div>
        </Row>
      </Col>
      {/* Progress bar */}
      <Row>
        <Col>
          <ProgressBar
            variant={fetching ? "primary" : "success"}
            now={100}
            animated={fetching}
            className="sp-progress-bar"
          />
        </Col>
      </Row>

      {/* Storage cards */}
      <div>
        <Row>
          <Col className="justify-content-start">
            {cardData.map((card, index) => (
              <StorageCard
                key={index}
                label={card.label}
                value={card.value}
                isLoading={fetching}
              />
            ))}
          </Col>
        </Row>

        {/* Last update timestamp */}
        {lastUpdate && (
          <Row className="sp-usage-pie-row">
            <Col>
              <div className="sp-usage-text-date">
                last update: <span className="sp-usage-text">{lastUpdate}</span>
              </div>
            </Col>
          </Row>
        )}
      </div>
    </>
  );
}

export default SciencePortalUserStorage;
