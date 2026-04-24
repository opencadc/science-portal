import React from "react";

import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import "./css/index.css";
import "./sp-session-list.css";

import {Bar} from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons/faTriangleExclamation";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export const barThickness = 12

// Static data for the blurred chart silhouette behind the overlay.
// These numbers are never readable to the user — the chart layer is blurred.
// Kept in the same shape as the live data so the component can be restored easily.
const STATIC_USAGE = {
  cpu: {
    used: 1094.838,
    free: 1911.162,
    total: 3006,
    display: { free: "1911.2", total: "3006.0" },
  },
  ram: {
    unit: "GB",
    used: 9727.83,
    free: 2431.6100000000006,
    total: 12159.44,
    display: { free: "2431.61", total: "12159.44" },
  },
};

function SciencePortalPlatformLoad() {

  // 99% sure that user feedback will be the horizontal stacked
  // charts are ok. Hanging on to this in case that changes in the
  // first pass of the Platform Usage panel addition
  // var xAxissessionData = {
  //   labels: props.usage.instances.labels,
  //   datasets: [
  //     {
  //       data: props.usage.instances.data,
  //       backgroundColor: props.usage.instances.backgroundColor,
  //       hoverBackgroundColor: props.usage.instances.hoverBackgroundColor
  //     }
  //   ]
  // }

  // var yAxisSessionData = {
  //   labels: ["instances"],
  //   datasets: [
  //     {
  //       label: props.usage.instances.labels[0],
  //       data: [props.usage.instances.data[0]],
  //       backgroundColor: props.usage.instances.backgroundColor[0],
  //       hoverBackgroundColor: props.usage.instances.hoverBackgroundColor[0]
  //     },
  //     {
  //       label: props.usage.instances.labels[1],
  //       data: [props.usage.instances.data[1]],
  //       backgroundColor: props.usage.instances.backgroundColor[1],
  //       hoverBackgroundColor: props.usage.instances.hoverBackgroundColor[1]
  //     },
  //     {
  //       label: props.usage.instances.labels[2],
  //       data: [props.usage.instances.data[2]],
  //       backgroundColor: props.usage.instances.backgroundColor[2],
  //       hoverBackgroundColor: props.usage.instances.hoverBackgroundColor[2]
  //     },
  //   ]
  // }

  var yAxisCPUData = {
    labels: ["CPU usage"],
    datasets: [
      {
        label: "used",
        data: [STATIC_USAGE.cpu.used],
        backgroundColor: "#008081",
        hoverBackgroundColor: "#4F97A3"
      },
      {
        label: "free",
        data: [STATIC_USAGE.cpu.free],
        backgroundColor: "#dedede",
        hoverBackgroundColor: "#efefef"
      }
    ]
  }

  var yAxisRAMData = {
    labels: ["Memory usage"],
    datasets: [
      {
        label: "used",
        data: [STATIC_USAGE.ram.used],
        backgroundColor: "#F19F18",
        hoverBackgroundColor: "#D28B15"
      },
      {
        label: "free",
        data: [STATIC_USAGE.ram.free],
        backgroundColor: "#dedede",
        hoverBackgroundColor: "#efefef"
      }
    ]
  }

  // Hanging on to this code in case user feedback in the first pass is to
  // use a doughnut or pie chart rather than the stacked bar
  // var CPUusagePieOptions = {
  //   plugins: {
  //     title: {
  //       display: false,
  //     },
  //     legend: {
  //       position: "right"
  //     }
  //   }
  // }

  // var CPUusagePieData = {
  //   labels: ["used", "free"],
  //   datasets: [
  //     {
  //       data: [
  //         props.usage.cpu.used,
  //         props.usage.cpu.free
  //       ],
  //       backgroundColor: [
  //         "#008081",
  //         "#dedede"
  //       ],
  //       hoverBackgroundColor: [
  //         "#4F97A3",
  //         "#efefef"
  //       ]
  //     }
  //   ]
  // };

  var horizontalStackedCPUOptions = {
    indexAxis: "y",
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false,
      }
    },
    responsive: true,
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        max: STATIC_USAGE.cpu.total
      },
      y: {
        beginAtZero: true,
        stacked: true,
        grid: {
          display: false,
        },
        max: 50
      },
    },
    borderRadius: 4,
    barThickness: barThickness
  }

  var horizontalStackedRAMOptions = {
    indexAxis: "y",
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false,
      }
    },
    responsive: true,
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        max: STATIC_USAGE.ram.total
      },
      y: {
        beginAtZero: true,
        stacked: true,
        grid: {
          display: false,
        },
        max: 50
      },
    },
    borderRadius: 4,
    barThickness: barThickness
  }

  /*
  var horizontalStackedBarOptions = {
    indexAxis: "y",
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false,
      }
    },
    responsive: true,
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        max: Math.max(props.usage.instances.total, 10)
      },
      y: {
        beginAtZero: true,
        stacked: true,
        grid: {
          display: false,
        },
        max: 50
      },
    },
    borderRadius: 4,
    barThickness: barThickness
  }
  */

  return (
    <div className="sp-usage-overlay-wrapper">
      <div className="sp-usage-charts-blurred" aria-hidden="true">
        <Row className="sp-usage-bar-row">
          <Col sm={12}>
            <div className="sp-usage-cpu-title">
              Available CPUs:  {STATIC_USAGE.cpu.display.free} / {STATIC_USAGE.cpu.display.total}
            </div>
            <div className="sp-usage-bar">
              <Bar options={horizontalStackedCPUOptions} data={yAxisCPUData} />
            </div>
          </Col>
        </Row>
        <Row className="sp-usage-bar-row">
          <Col sm={12}>
            <div className="sp-usage-ram-title">
              Available RAM:  {STATIC_USAGE.ram.display.free}{STATIC_USAGE.ram.unit} / {STATIC_USAGE.ram.display.total}{STATIC_USAGE.ram.unit}
            </div>
            <div className="sp-usage-bar">
              <Bar options={horizontalStackedRAMOptions} data={yAxisRAMData} />
            </div>
          </Col>
        </Row>
        {/*<Row className="sp-usage-bar-row">*/}
        {/*  <Col>*/}
        {/*    <div className="sp-usage-session-title">*/}
        {/*      Running Instances: {props.usage.instances.total}*/}
        {/*    </div>*/}
        {/*    <div className="sp-usage-bar">*/}
        {/*      <Bar options={horizontalStackedBarOptions} data={yAxisSessionData} />*/}
        {/*    </div>*/}
        {/*  </Col>*/}
        {/*</Row>*/}
      </div>

      <div className="sp-usage-overlay" role="status" aria-live="polite">
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          className="sp-usage-overlay-icon"
          aria-hidden="true"
        />
        <div className="sp-usage-overlay-text">
          The cluster capacity information widget is no longer available.
          A new capacity tool is being developed.
        </div>
      </div>
    </div>
  )
}

export default SciencePortalPlatformLoad;
