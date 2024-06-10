import React, { useEffect, useState ,useRef} from 'react';
import { Routes,Route, Link } from 'react-router-dom';
import * as d3 from 'd3';
import { json, geoPath, geoEqualEarth } from 'd3';
import { feature } from 'topojson';
import { browserData, data , monthlyStats} from './data';
import './app.css';

const App = () => {
  return (
      <div className='container-box'>
        <Navbar />
        <Routes>

          <Route path="/monthly-stats" element={<GraphContainer />}/>
            
          <Route path="/" element={<WorldMap />}/>
            
          <Route path="/bar-chart" element={<BarContainer />}/>
            
          <Route path="/pie-chart" element={<PieChartContainer/>}/>
        </Routes>
      </div>
  );
};
export default App;

const Navbar = () => {
  return (
    <div className='navbar'>
        <nav>
          <Link to="/">World Map</Link>
        </nav>
        <nav>
          <Link to="/monthly-stats">Monthly Stats</Link>
        </nav>
        <nav>
          <Link to="/bar-chart">Bar chart </Link>
        </nav>
        <nav>
          <Link to="/pie-chart">Pie chart </Link>
        </nav>
    </div>
  );
};



// linear graphical repesentations
const GraphContainer = () => 
{
  const [metric, setMetric] = useState('clicks'); // State to track the selected metric

  return (
    <div className="graph-container">
      <div className="controls">
      <button className="btn" onClick={() => setMetric('clicks')}>Clicks</button>
      <button className="btn" onClick={() => setMetric('scans')}>Scans</button>
      </div>
      <div className="chart-wrapper">
        <LinearGraph metric={metric} />
      </div>
    </div>
  );
};

const LinearGraph = ({ metric }) => 
{
  const svgRef = useRef();
  const [data, setData] = useState(monthlyStats);
  const numDays = new Date(2024, 5, 0).getDate(); 
  const width = 960;
  const height = 400;
  const margin = {
    top: 40,
    bottom: 30,
    right: 20,
    left: 40,
  };

  useEffect(() => {
    const svg = d3.select(svgRef.current)

    svg.selectAll("*").remove();
    svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .style("border", "1px dotted #000");

    const g = svg.append('g')
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const tooltip = d3.select("body").append("div").attr("class", "tool-tip");

    // g.append("rect")
    //   .attr("width", width)
    //   .attr("height", height)
    //   .attr("fill", "lightblue");

    const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S:%L");
    const formattedData = data.map(d => ({
      dateTime: parseTime(d.dateTime),
      clicks: d.clicks,
      scans: d.scans,
    })).filter(d => d.dateTime >= new Date(2024, 4, 1) && d.dateTime <= new Date(2024, 5, 1));

    const x = d3.scaleTime()
      .domain([new Date(2024, 4, 1), new Date(2024, 5, 1)])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(formattedData, d => Math.max(d[metric])) + 10])
      .range([height, 0]);
    
    const xAxisGrid = d3.axisBottom(x).ticks(numDays).tickSize(-height).tickFormat('');
    const yAxisGrid = d3.axisLeft(y).tickSize(-width).tickFormat('');

    g.append("g")
      .attr("class", "x-grid grid")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxisGrid);

    g.append("g")
      .attr("class", "y-grid grid")
      .call(yAxisGrid);

    const line = d3.line()
      .x(d => x(d.dateTime))
      .y(d => y(d[metric]))

    const circle = g.append("circle")
      .attr("r", 0)
      .attr("fill", "steelblue")
      .attr("stroke", "white")
      .attr("opacity", 0.7)
      .style("pointer-events", "none");

    const listeningRect = g.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "none")
      .attr("pointer-events", "all");

    g.append("path")
      .datum(formattedData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 3.5)
      .attr("d", line);


    const xAxis = d3.axisBottom(x).ticks(numDays).tickFormat(d3.timeFormat("%d"));
    const yAxis = d3.axisLeft(y);

    g.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis);

    g.append("g")
      .call(yAxis);
    
    // g.selectAll(".dot")
    // .data(formattedData)
    // .enter().append("circle")
    // .attr("class", "dot")
    // .attr("cx", d => x(d.dateTime))
    // .attr("cy", d => y(d[metric]))
    // .attr("r", 5)
    // .attr("fill", "steelblue");

    listeningRect.on("mousemove", (event) => {
      const [xCoord] = d3.pointer(event);
      const bisectDate = d3.bisector(d => d.dateTime).left;
      const x0 = x.invert(xCoord);
      const i = bisectDate(formattedData, x0, 1);
      const d0 = formattedData[i - 1];
      const d1 = formattedData[i];
      if (!d0 || !d1) return;
      const d = x0 - d0.dateTime > d1.dateTime - x0 ? d1 : d0;
      const xPos = x(d.dateTime);
      const yPos = y(d[metric]);

      circle.attr("cx", xPos).attr("cy", yPos).attr("r", 10);

      if(d)
      {
        tooltip
        .style("display", "block")
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 10}px`)
        .html(`<strong>Date:</strong> ${new Date(d.dateTime).toLocaleDateString()}<br><strong>${metric==="clicks" ? "Clicks: ": "Scans: "}</strong> ${d[metric]}`);
      }
    });

    listeningRect.on("mouseleave", () => {
      circle.attr("r", 0);
      tooltip.style("display", "none");
    });
  }, [data,metric]);

  return (
    <div className='box'>
      <svg ref={svgRef}></svg>
    </div>
  );
};


// Bar Chart

const BarContainer = () => 
  {
    const [metric, setMetric] = useState('clicks');
  
    return (
      <div className="graph-container">
        <div className="controls">
        <button className="btn" onClick={() => setMetric('clicks')}>Clicks</button>
        <button className="btn" onClick={() => setMetric('scans')}>Scans</button>
        </div>
        <div className="chart-wrapper">
          <Learning metric={metric} />
        </div>
      </div>
    );
  };

  const Learning = ({ metric }) => 
  {
    const svgRef = useRef();
    const [data, setData] = useState(monthlyStats);
    const numDays = new Date(2024, 5, 0).getDate();
    const width = 960;
    const height = 400;
    const margin = {
      top: 40,
      bottom: 30,
      right: 20,
      left: 40,
    };
  
    useEffect(() => {
      const svg = d3.select(svgRef.current);
  
      svg.selectAll("*").remove();
      svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("border", "1px dotted #000");
  
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  
      const tooltip = d3.select("body").append("div").attr("class", "tool-tip");
  
      g.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#d1e2d3");
  
      const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S:%L");
      const formattedData = data
        .map(d => ({
          dateTime: parseTime(d.dateTime),
          clicks: d.clicks,
          scans: d.scans,
        }))
        .filter(d => d.dateTime >= new Date(2024, 4, 1) && d.dateTime <= new Date(2024, 5, 1));
  
      const x = d3.scaleBand()
        .domain(formattedData.map(d => d.dateTime))
        .range([0, width])
        .padding(0.1);
  
      const y = d3.scaleLinear()
        .domain([0, d3.max(formattedData, d => Math.max(d[metric])) + 10])
        .range([height, 0]);
  
      const bars=g.selectAll(".bar")
        .data(formattedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.dateTime))
        .attr("y", d => y(d[metric]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d[metric]))
        .attr("fill", "#0B3E87")
        .on("mousemove", function (event, d){
          d3.select(this).attr("fill","#1E78FA")
          tooltip
            .style("display", "block")
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`)
            .html(`<strong>Date:</strong> ${new Date(d.dateTime).toLocaleDateString()}<br><strong>${metric === "clicks" ? "Clicks: " : "Scans: "}</strong> ${d[metric]}`);
        })
        .on("mouseleave",function (){
          d3.select(this).attr("fill","#0B3E87")
          tooltip.style("display", "none");
        });
  
      const xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%d"));
      const yAxis = d3.axisLeft(y);
  
      g.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);
  
      g.append("g").call(yAxis);
  
    }, [data, metric]);
  
    return (
      <div className='box'>
        <svg ref={svgRef}></svg>
      </div>
    );
  };


// Map geographical representations
  
  const WorldMap = () => {
    const [countries, setCountries] = useState(null);
    const [countryData, setCountryData] = useState(data);
    const [tooltip, setTooltip] = useState(null);
    const [metric, setMetric] = useState('clicks');
    const [selectedCountry, setSelectedCountry] = useState(null);
    const svgRef=useRef()
  
    const url = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";
  
    useEffect(() => {
      json(url)
        .then(data => {
          setCountries(feature(data, data.objects.countries));
        })
        .catch(err => console.log(err));
    }, []);
  
    const handleMouseEnter = (event, country) => {
      const { pageX, pageY } = event;
      const { name } = country.properties;
      const countryInfo = countryData.find(item => item.country.toLowerCase() === name.toLowerCase());
      if (countryInfo) {
        const value = countryInfo[metric];
        const tooltipContent = { country: name, value: value };
        setTooltip({ content: tooltipContent, x: pageX, y: pageY });
      }
    };
  
    const handleMouseLeave = () => {
      setTooltip(null);
    };
  
    const handleCountryClick = (country) => {
      const { name } = country.properties;
      const countryProvinces = countryData.find(item => item.country.toLowerCase() === name.toLowerCase());
      setSelectedCountry(countryProvinces);
    };
  
    const getColor = (country) => {
      const countryInfo = countryData.find(item => item.country.toLowerCase() === country.properties.name.toLowerCase());
      if (countryInfo) {
        const value = countryInfo[metric];
        if (value >= 0 && value < 2500) return '#B5C20B';
        if (value >= 2500 && value < 5000) return '#3BC20B';
        if (value >= 5000 && value < 7500) return '#0B8EC2';
        if (value >= 7500 && value < 10000) return '#620AE8';
      }
      return '#E2D8F0';
    };
  
    return (
      <div className='container'>
        <div className='controls'>
          <button onClick={() => setMetric('clicks')}>Clicks</button>
          <button onClick={() => setMetric('scans')}>Scans</button>
        </div>
        <div className='legend'>
          <div><span style={{ backgroundColor: '#B5C20B' }}></span> 0 - 2500</div>
          <div><span style={{ backgroundColor: '#3BC20B' }}></span> 2500 - 5000</div>
          <div><span style={{ backgroundColor: '#0B8EC2' }}></span> 5000 - 7500</div>
          <div><span style={{ backgroundColor: '#620AE8' }}></span> 7500 - 10000</div>
          <div><span style={{ backgroundColor: '#E2D8F0' }}></span> No data</div>
        </div>
        {selectedCountry && <ProvinceDetails country={selectedCountry} metric={metric} />}
        {tooltip && <Tooltip tooltip={tooltip} metric={metric} />}
        <div className="map-container">
          <svg ref={svgRef} viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet">
            {countries && <Marks data={countries} handleMouseEnter={handleMouseEnter} handleMouseLeave={handleMouseLeave} handleCountryClick={handleCountryClick} getColor={getColor} />}
          </svg>
        </div>
      </div>
    );
  };
  
  const Marks = ({ data, handleMouseEnter, handleMouseLeave, handleCountryClick, getColor }) => {
    const projection = geoEqualEarth().fitSize([800, 450], { type: "Sphere" });
    const path = geoPath(projection);
  
    return (
      <g className='marks'>
        <path className='sphere' d={path({ type: "Sphere" })} />
        {data.features.map((feature, index) =>
          <path
            key={feature.id || index}
            className='feature'
            d={path(feature)}
            fill={getColor(feature)}
            onMouseEnter={event => handleMouseEnter(event, feature)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleCountryClick(feature)}
          />
        )}
      </g>
    );
  };
  
  const Tooltip = ({ tooltip, metric }) => {
    return (
      <div
        style={{
          position: 'absolute',
          top: `${tooltip.y}px`,
          left: `${tooltip.x}px`,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '8px',
          pointerEvents: 'none',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
          {tooltip.content.country}
        </p>
        <p style={{ fontSize: '12px', margin: '2px 0' }}>
          {metric.charAt(0).toUpperCase() + metric.slice(1)}: {tooltip.content.value}
        </p>
      </div>
    );
  };
  
  const ProvinceDetails = ({ country, metric }) => {
    if (!country.provinces || country.provinces.length === 0) {
      return (
        <div className='details-container'>
          <h3>{country.country} - Province Details</h3>
          <div className="details">
            <p>No data available</p>
          </div>
        </div>
      );
    }
  
    return (
      <div className='details-container'>
        <h3>{country.country} - Province Details</h3>
        <div className="details">
          <ul>
            {country.provinces.map((province, index) => (
              <li key={index}>
                <span className="province-name">{province.province}</span>: {province[metric]} {metric === "clicks" ? "Clicks" : "Scans"}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };
  
  

//pie chart representation

const PieChartContainer = () => {
  const [data, setData] = useState(browserData);
  const [metric, setMetric] = useState('clicks');
  const svgRef = useRef();
  const labelsRef = useRef();
  const tooltipRef = useRef(null);

  const customColors = [
    "#5420A2",
    "#20A289",
    "#CBCE09",
    "#CE09CB",
    "#3F910D",
    "#910D27",
    "#DA7C0C",
    "#09A69F",
    "#F60BA4",
    "#585256",
    "#1568C1"
  ];
  

  useEffect(() => {
    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const pie = d3.pie().value(d => d[metric]);
    const data_ready = pie(data);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    svg.selectAll('path')
      .data(data_ready)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => customColors[i % customColors.length])
      .style('stroke-width', '2px')
      .style('stroke', 'white')
      .on('mouseenter', (event, d, i) => {
        const tooltipContent = `${d.data.name}: ${d.data[metric]} ${metric === 'clicks' ? 'Clicks' : 'Scans'}`;
        tooltipRef.current.innerHTML = tooltipContent;
        tooltipRef.current.style.display = 'block';

        tooltipRef.current.style.left = `${event.pageX + 10}px`;
        tooltipRef.current.style.top = `${event.pageY + 10}px`;

        d3.select(event.target)
          .transition()
          .duration(100)
          .attr('fill', "lightgrey");
      })
      .on('mousemove', (event) => {
        tooltipRef.current.style.left = `${event.pageX + 10}px`;
        tooltipRef.current.style.top = `${event.pageY + 10}px`;
      })
      .on('mouseleave', (event, d) => {
        tooltipRef.current.style.display = 'none';
        d3.select(event.target)
          .transition()
          .duration(100)
          .attr('fill', customColors[data_ready.indexOf(d) % customColors.length]);
      });

    const labels = data_ready.map(d => d.data.name);
    const labelContainer = d3.select(labelsRef.current);

    const labelGroups = labelContainer.selectAll('div')
      .data(labels)
      .enter()
      .append('div')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('margin-bottom', '5px');

    labelGroups.append('div')
      .style('width', '10px')
      .style('height', '10px')
      .style('background-color', (d, i) => customColors[i % customColors.length])
      .style('margin-right', '5px');

    labelGroups.append('span')
      .text(d => d);
  }, [data, metric]);

  return (
    <div className='pie-chart-container'>
      <div className='controls'>
        <button onClick={() => setMetric('clicks')}>Clicks</button>
        <button onClick={() => setMetric('scans')}>Scans</button>
      </div>
      <div className="pie-chart">
        <svg ref={svgRef}></svg>
        <div ref={labelsRef}></div>
      </div>
      <div ref={tooltipRef} className='tool-tip' style={{ position: 'absolute', display: 'none', backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white', padding: '5px', borderRadius: '3px', pointerEvents: 'none' }}></div>
    </div>
  );
};

