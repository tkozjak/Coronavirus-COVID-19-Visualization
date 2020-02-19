
// SELECT SVG ELEMENT
var svg = d3.select("#bar_chart_container").style("background-color", "#330000");
var svg_width = svg.node().getBoundingClientRect().width;
var svg_height = svg.node().getBoundingClientRect().height;

var svg_div = d3.select("#side_box_div");



console.log("SVG. Width: " + svg_width);
console.log("SVG. Width: " + svg_height);

// GET COVID-19 CSV URL
//var covid_url = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/archived_data/archived_time_series/time_series_2019-ncov-Confirmed.csv";

var covid_url = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv";


// D3 elements
var all_bars;
var all_labels;
var all_values;

// COVID-19 dates
var c19_dates = [];
var c19_number_of_dates = -1;
var c19_number_of_places = -1;

// sorted data (array of objects)
var sorted_data;
var data_set = false;

// SVG dimensions
var label_margin = 200;
var right_margin = 345;
var bar_height = 20;
var top_padding = 10;
var bottom_padding = 30;


//RENDER COVID-19
renderCovidBars = data => {

  // we start with the first date
  let selected_date = c19_dates[0];
  let max_value_selected_date = d3.max(data, d => Number(d[selected_date][0]))

  svg_height = svg.node().getBoundingClientRect().height;

  //const xScale = d3.scaleLinear()
  const xScale = d3.scaleLog()
    .base(Math.E)
    .clamp(true)
    .domain([0.1, max_value_selected_date])
    .range([0, right_margin]);

  const yScale = d3.scaleLinear()
    .domain([c19_number_of_places, 0])
    .range([top_padding, svg_height-bottom_padding]);

  console.log("Domain on xScale: " + xScale.domain());
  console.log("Domain on yScale: " + yScale.domain());

  var bars;



  all_bars = svg.selectAll('rect')
    .data(data)
    .enter().append('rect')
    .attr('y', d => yScale(d[selected_date][1]))
    .attr('x', label_margin)
    .attr('width', d => xScale(d[selected_date][0]))
    .attr('height', bar_height - 2)
    .attr('fill', d => d.colour);


  all_labels = svg.selectAll('text')
    .data(data)
    .enter().append('text')
    .attr('y', d => (yScale(d[selected_date][1])) + bar_height / 2 + 4)
    .attr('class', 'bar_label')
    .attr('x', label_margin - 2)
    .attr('text-anchor', 'end')
    .html(d => (d["Province/State"] == "" ? d["Country/Region"] : d["Province/State"]) + ":" + d["Country/Region"] + " " + d[selected_date][1]);


  all_values = svg.selectAll('text.value_text')
    .data(data)
    .enter().append('text')
    .attr('x', d => (xScale(d[selected_date][0])) + label_margin + 2)
    .attr('y', d => (yScale(d[selected_date][1])) + bar_height / 2 + 4)
    .attr('class', 'bar_label')
    .html(d => d[selected_date][0]);

  return bars;
}



// LOAD AND SET COVID-19 DATA
d3.csv(covid_url).then(function (data) {

  console.log("COVID-19. First row: ");
  console.log(data[0]);

  // check the number of the dates
  // data array has objects, so we count keys
  var num_columns = Object.keys(data[0]).length;

  console.log("COVID-19. Number of columns: " + num_columns);
  console.log("COVID-19. Object keys: " + Object.keys(data[0]));

  // fill dates keys
  for (var i = 4; i < Object.keys(data[0]).length; i++) {
    c19_dates[i - 4] = Object.keys(data[0])[i];
  }

  c19_number_of_dates = c19_dates.length;
  c19_number_of_places = data.length;

  svg_height = top_padding + c19_number_of_places * bar_height + bottom_padding;
  svg_div.select('svg').style('height', String(svg_height) + "px");

  console.log("COVID-19. Recorded dates: " + c19_dates);
  console.log("COVID-19. Number of dates: " + c19_number_of_dates);

  // iterate over each data item (row) in the data array
  // transform some data into numerical values
  // add color to data items
  data.forEach(d => {
    d.Lat = +d.Lat,
      d.Long = +d.Long,
      d.colour = d3.hsl(Math.random() * 360, 0.75, 0.75)
  });


  // iterate over each recorded date
  // sort data items based on the value in the date column
  // assign the rank to each value
  for (var i = 0; i < c19_number_of_dates; i++) {

    let date_key = c19_dates[i];

    //transform recorded values to numbers
    data.forEach(item => item[date_key] = Number(item[date_key]));

    sorted_data = data.sort((a, b) => d3.ascending(a[date_key], b[date_key]));

    sorted_data.forEach((d, i) => (d[date_key] = [d[date_key], i]));

    //console.log("COVID-19. Ranked data item " + i + ", " + date_key + "  : ");
    //console.log(data[i]);

  }

  data_set = true;
  d3.select("#date_text").html(c19_dates[0]);
  // CREATE 3D SCENE DATA OBJECTS
  SCENE_3D_addDataPoints(sorted_data, c19_dates[0]);

  // INITIAL RENDER
  renderCovidBars(sorted_data);

  // CHANGE THE DATE - dapending on the slider value
  function changeDate(index) {

    let selected_date = c19_dates[index];
    svg_height = svg.node().getBoundingClientRect().height;

    //update ui elements
    d3.select("#date_text").html(selected_date);

    // UPDATE 3D SCENE DATA OBJECTS
    SCENE_3D_updateDataPoints(sorted_data, selected_date);

    let max_value_selected_date = d3.max(data, d => Number(d[selected_date][0]))

    // recalculate x axis data to pixel mapping
    //const xScale = d3.scaleLinear().domain([0, max_value_selected_date]).range([00, 750]);
    const xScale = d3.scaleLog()
      .clamp(true)
      .domain([0.1, max_value_selected_date]).range([0, right_margin]);

    const yScale = d3.scaleLinear().domain([c19_number_of_places, 0]).range([top_padding, svg_height-bottom_padding]);

    all_bars.transition().ease(d3.easeLinear).duration(1000).attr('width', d => xScale(Number(d[selected_date][0])))
      .attr('y', d => yScale(d[selected_date][1]))

    all_labels.html(d => (d["Province/State"] == "" ? d["Country/Region"] : d["Province/State"]) + ":" + d["Country/Region"] + " " + d[selected_date][1])
      .transition().ease(d3.easeLinear).duration(1000).attr('y', d => (yScale(d[selected_date][1]) + bar_height / 2 + 4));

    all_values.html(d => d[selected_date][0]).transition().ease(d3.easeLinear).duration(1000)
      .attr('y', d => (yScale(d[selected_date][1]) + bar_height / 2 + 4))
      .attr('x', d => (xScale(d[selected_date][0])) + label_margin + 2);

  }


  // OBSERVE SELECTED INDEX and DATE and CHANGE NUMBER OF CASES
  var observe_selected_index = document.querySelector("#selected_index");
  var selected_observer = new MutationObserver(function () {
    changeConfirmedCases();
  });
  selected_observer.observe( observe_selected_index, {subtree: true, childList: true} );

  var observe_selected_date = document.querySelector("#date_text");
  var date_observer = new MutationObserver(function () {
    changeConfirmedCases();
  });
  selected_observer.observe( observe_selected_date, {subtree: true, childList: true} );

  function changeConfirmedCases(){
    let selected_index = Number(d3.select("#selected_index").html());
    let selected_date = d3.select("#date_text").html();
    if(Number(selected_index) != -1){
      let selected_cases = sorted_data[selected_index][selected_date];
      d3.select("#cases_text").html(String(selected_cases[0]));
    }
  }


  // SLIDER LISTENER
  d3.select("#mySlider")
    .property('value', "0")
    .attr('max', c19_number_of_dates - 1)
    .on("input", function (d) {
      selectedValue = this.value
      changeDate(selectedValue)
    })

});
