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
import Placeholder from "react-bootstrap/Placeholder";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export const barThickness = 12

function SciencePortalPlatformLoad(props) {

  if (props.usage.listType === "data") {
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
          data: [props.usage.cpu.used],
          backgroundColor: "#008081",
          hoverBackgroundColor: "#4F97A3"
        },
        {
          label: "free",
          data: [props.usage.cpu.free],
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
          data: [props.usage.ram.used],
          backgroundColor: "#F19F18",
          hoverBackgroundColor: "#D28B15"
        },
        {
          label: "free",
          data: [props.usage.ram.free],
          backgroundColor: "#dedede",
          hoverBackgroundColor: "#efefef"
        }
      ]
    }
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

  // CPU usage has its own max value, so this object is needed
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
        max: props.usage.cpu.total
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
        max: props.usage.ram.total
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
    <>
    {props.usage.listType === "data" &&
        <>
          <Row className="sp-usage-bar-row">
            <Col sm={12}>
              <div className="sp-usage-cpu-title">
                Available CPUs:  {props.usage.cpu.display.free} / {props.usage.cpu.display.total}
              </div>
              <div className="sp-usage-bar">
                <Bar options={horizontalStackedCPUOptions} data={yAxisCPUData} />
              </div>
            </Col>
          </Row>
          <Row className="sp-usage-bar-row">
            <Col sm={12}>
              <div className="sp-usage-ram-title">
                Available RAM:  {props.usage.ram.display.free}{props.usage.ram.unit} / {props.usage.ram.display.total}{props.usage.ram.unit}
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
          <Row className="sp-usage-pie-row">
            <Col>
              <div className="sp-usage-text-date">
                last update: <span className="sp-usage-text">{props.usage.updated}</span> UTC
              </div>
            </Col>
          </Row>
        </>
      }

      {props.usage.listType === "loading" &&
        <>
          <Row className="sp-usage-title-placeholder">
          <Col>
            <Placeholder className="sp-form-p sp-usage-title-placeholder"  animation="glow">
              <Placeholder className="sp-form-placeholder sp-usage-title-placeholder" xs={12} />
            </Placeholder>
          </Col>
          </Row>
          <Row className="sp-usage-placeholder">
            <Col>
              <Placeholder className="sp-form-p sp-usage-placeholder"  animation="glow">
                <Placeholder className="sp-form-placeholder sp-usage-placeholder" xs={12} />
              </Placeholder>
            </Col>
          </Row>
          <Row className="sp-usage-title-placeholder">
          <Col>
            <Placeholder className="sp-form-p sp-usage-title-placeholder"  animation="glow">
              <Placeholder className="sp-form-placeholder sp-usage-title-placeholder" xs={12} />
            </Placeholder>
          </Col>
          </Row>
          <Row className="sp-usage-placeholder">
            <Col>
              <Placeholder className="sp-form-p sp-usage-placeholder"  animation="glow">
                <Placeholder className="sp-form-placeholder sp-usage-placeholder" xs={12} />
              </Placeholder>
            </Col>
          </Row>
          <Row className="sp-usage-title-placeholder">
            <Col>
              <Placeholder className="sp-form-p sp-usage-title-placeholder"  animation="glow">
                <Placeholder className="sp-form-placeholder sp-usage-title-placeholder" xs={12} />
              </Placeholder>
            </Col>
          </Row>
          <Row className="sp-usage-placeholder">
            <Col>
              <Placeholder className="sp-form-p sp-usage-placeholder"  animation="glow">
                <Placeholder className="sp-form-placeholder sp-usage-placeholder" xs={12} />
              </Placeholder>
            </Col>
          </Row>
        </>
      }
    </>
  )
}

export default SciencePortalPlatformLoad;
