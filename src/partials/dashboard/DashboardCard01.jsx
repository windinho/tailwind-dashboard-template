import React from "react";
import { Link } from "react-router-dom";
import LineChart from "../../charts/LineChart01";
import { chartAreaGradient } from "../../charts/ChartjsConfig";
import EditMenu from "../../components/DropdownEditMenu";

// Import utilities
import { adjustColorOpacity, getCssVariable } from "../../utils/Utils";
import CloudHierarchyD3 from "./CloudHierarchyD3";

function DashboardCard01() {
  const chartData = {
    labels: [
      "12-01-2022",
      "01-01-2023",
      "02-01-2023",
      "03-01-2023",
      "04-01-2023",
      "05-01-2023",
      "06-01-2023",
      "07-01-2023",
      "08-01-2023",
      "09-01-2023",
      "10-01-2023",
      "11-01-2023",
      "12-01-2023",
      "01-01-2024",
      "02-01-2024",
      "03-01-2024",
      "04-01-2024",
      "05-01-2024",
      "06-01-2024",
      "07-01-2024",
      "08-01-2024",
      "09-01-2024",
      "10-01-2024",
      "11-01-2024",
      "12-01-2024",
      "01-01-2025",
    ],
    datasets: [
      // Indigo line
      {
        data: [
          732, 610, 610, 504, 504, 504, 349, 349, 504, 342, 504, 610, 391, 192,
          154, 273, 191, 191, 126, 263, 349, 252, 423, 622, 470, 532,
        ],
        fill: true,
        backgroundColor: function (context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          return chartAreaGradient(ctx, chartArea, [
            {
              stop: 0,
              color: adjustColorOpacity(
                getCssVariable("--color-violet-500"),
                0
              ),
            },
            {
              stop: 1,
              color: adjustColorOpacity(
                getCssVariable("--color-violet-500"),
                0.2
              ),
            },
          ]);
        },
        borderColor: getCssVariable("--color-violet-500"),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: getCssVariable("--color-violet-500"),
        pointHoverBackgroundColor: getCssVariable("--color-violet-500"),
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
      // Gray line
      {
        data: [
          532, 532, 532, 404, 404, 314, 314, 314, 314, 314, 234, 314, 234, 234,
          314, 314, 314, 388, 314, 202, 202, 202, 202, 314, 720, 642,
        ],
        borderColor: adjustColorOpacity(
          getCssVariable("--color-gray-500"),
          0.25
        ),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: adjustColorOpacity(
          getCssVariable("--color-gray-500"),
          0.25
        ),
        pointHoverBackgroundColor: adjustColorOpacity(
          getCssVariable("--color-gray-500"),
          0.25
        ),
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
    ],
  };

  const rawData = {
    nodes: [
      {
        id: "cloud",
        label: "Cloud",
        type: "cloud",
        alerts: 253,
        misconfigs: 18,
        children: ["aws1", "aws2", "gcp", "saas"],
      },
      {
        id: "aws1",
        label: "AWS 1",
        type: "aws",
        alerts: 84,
        misconfigs: 3,
        children: ["s3"],
      },
      {
        id: "aws2",
        label: "AWS 2",
        type: "aws",
        alerts: 124,
        misconfigs: 4,
        children: ["rds"],
      },
      { id: "gcp", label: "GCP", type: "gcp", alerts: 28, misconfigs: 9 },
      { id: "saas", label: "SaaS", type: "saas", alerts: 123, misconfigs: 5 },
      { id: "s3", label: "S3", type: "service", alerts: 66, misconfigs: 3 },
      { id: "rds", label: "RDS", type: "service", alerts: 68, misconfigs: 1 },
    ],
    edges: [
      { source: "cloud", target: "aws1" },
      { source: "cloud", target: "aws2" },
      { source: "cloud", target: "gcp" },
      { source: "cloud", target: "saas" },
      { source: "aws1", target: "s3" },
      { source: "aws2", target: "rds" },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Plus
          </h2>
          {/* Menu button */}
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <Link
                className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3"
                to="#0"
              >
                Option 1
              </Link>
            </li>
            <li>
              <Link
                className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3"
                to="#0"
              >
                Option 2
              </Link>
            </li>
            <li>
              <Link
                className="font-medium text-sm text-red-500 hover:text-red-600 flex py-1 px-3"
                to="#0"
              >
                Remove
              </Link>
            </li>
          </EditMenu>
        </header>
        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">
          Sales
        </div>
        <div className="flex items-start">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">
            $24,780
          </div>
          <div className="text-sm font-medium text-green-700 px-1.5 bg-green-500/20 rounded-full">
            +49%
          </div>
        </div>
      </div>
      {/* Chart built with Chart.js 3 */}
      <div className="grow max-sm:max-h-[128px] xl:max-h-[128px]">
        {/* Change the height attribute to adjust the chart height */}
        {/* <LineChart data={chartData} width={389} height={128} /> */}
        <CloudHierarchyD3 rawData={rawData} />
      </div>
    </div>
  );
}

export default DashboardCard01;
