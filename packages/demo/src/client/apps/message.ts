import Chart from "chart.js/auto";
import { getClientAPI } from "@kite9/client";

const ratios = ["D/E", "QR", "ROE", "ROA", "ROI", "Tang"];
const data = {
    MSFT: {
        radar: [0.17, 1.23, 0.3754, 0.1902, .03882, 0.7372],
        revenue: "$20k ▲",
        cogs: "$3k ▼"
    },
    TSLA: {
        radar: [0.04, 1.17, 0.2328, 0.1364, 0.1215, 0.2345],
        revenue: "$15k ▲",
        cogs: "$20k ▼"
    }
}


const updateContext = (ticker: keyof typeof data, chart: Chart) => {
    const {radar, revenue, cogs} = data[ticker];
    document.querySelector("h1")!.textContent = ticker;
    document.querySelector("#revenue-value")!.textContent = revenue;
    document.querySelector("#revenue-value")!.style.color = revenue.includes("▲") ? "green" : "red";
    document.querySelector("#cogs-value")!.textContent = cogs;
    document.querySelector("#cogs-value")!.style.color = cogs.includes("▲") ? "green" : "red";
    chart.data.datasets[0].data = radar;
    chart.update();
}

const init = async () => {
    const spark = document.getElementById("spark");
    const chart = new Chart(spark, {
        type: "radar",
        data: {
            labels: ratios,
            datasets: [
                {
                    data: [0,0,0,0,0,0,0]
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    updateContext("MSFT", chart);

    
    const fdc3 = await getClientAPI();
    fdc3.addIntentListener("ViewChart", (context) => {
        if(context.id.ticker in data){
            updateContext(context.id.ticker, chart);
        }
    })
}

window.addEventListener("load", () => init());