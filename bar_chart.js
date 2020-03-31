
//
//  DATA URLs
//

// MY REPO (FALLBACK)
//confiremd
var fallback_url = "https://raw.githubusercontent.com/tkozjak/Coronavirus-COVID-19-Visualization/master/data/time_series_19-covid-Confirmed.csv";

// JOHNS HOPKINS REPO
// confirmed
var covid_confirmed_url = "https://raw.githubusercontent.com/tkozjak/Coronavirus-COVID-19-Visualization/UI-Rework/data/COVID19_DATA_Confirmed.csv";
// deaths
var covid_deaths_url = "https://raw.githubusercontent.com/tkozjak/Coronavirus-COVID-19-Visualization/UI-Rework/data/COVID19_DATA_Deaths.csv";
// recovered
var covid_recovered_url = "https://raw.githubusercontent.com/tkozjak/Coronavirus-COVID-19-Visualization/UI-Rework/data/COVID19_DATA_Recovered.csv";


//
//  CHECK URL
//
/*
var url = CheckUrl(covid_confirmed_url);
if (url == true) {
  //url exists    
}
else {
  //url not exists
  console.log("file does not exist!")
  covid_confirmed_url = fallback_url;
}

function CheckUrl(url) {
  if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
    var http = new XMLHttpRequest();
  }
  else {// code for IE6, IE5
    var http = new ActiveXObject("Microsoft.XMLHTTP");
  }
  http.open('HEAD', url, false);
  http.send();
  return http.status != 404;
}
*/


// SELECT BAR CHART SVG ELEMENT
var svg = d3.select("#bar_chart_container");
var svg_width = svg.node().getBoundingClientRect().width;
var svg_height = svg.node().getBoundingClientRect().height;


// SELECT DIV EL. THAT HOLDS SVG EL.
var svg_div = d3.select("#side_box_div");
console.log("SVG. Width: " + svg_width);
console.log("SVG. Width: " + svg_height);


// CALENDAR SVG ELEMENTS and DATA
var cal_svg = d3.select("#calendar-svg");
var selected_date_marker;


// COVID-19 DATA
var c19_dates = [];             // dates - in m/d/y format - dates are also the keys 
var c19_number_of_dates = -1;   // total number of recorded dates  
var c19_number_of_places = -1;  // total number of tracked locations

var c19_total_cases = [];       // total number of confirmed cases on specific date
var c19_total_deaths = [];      // total number of deaths on specific date
var c19_total_recovered = [];   // total number of recoverd cases on specific date

var c19_total_locations = [];   // total number of affected locations on specific date ( NOT IMPLEMENTED YET )


// D3 DATA OBJECT (array of objects)
var sorted_combined_data;

// flags
var data_set = false;
var bars_initialized = false;
var calendar_set = false;
var bars_3d_set = false;

var use_log = true;     // we use log scale ( LINEAR SCALE IS NOT FULLY IMPLEMENTED )


//
//  LOAD AND SET COVID-19 DATA
//

d3.csv(covid_confirmed_url).then(function (data) {
  d3.csv(covid_deaths_url).then(function (data_deaths) {
    d3.csv(covid_recovered_url).then(function (data_recovered) {

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

      console.log("COVID-19. Recorded dates: " + c19_dates);
      console.log("COVID-19. Number of dates: " + c19_number_of_dates);

      // iterate over each data item (row) in the data array
      // transform some data into numerical values
      // add color to data items
      data.forEach(d => {
        d.Lat = +d.Lat,
          d.Long = +d.Long,
          d.colour = d3.hsl(Math.random() * 360, 0.65, 0.45) // TO-DO: MAKE BETTER COLOR SCHEME
      });


      // convert values to numbers and add indices
      for (var i = 0; i < c19_number_of_dates; i++) {

        let date_key = c19_dates[i];

        data.forEach((item, i) => item[date_key] = [Number(item[date_key]), i]);
        data_deaths.forEach((item, i) => item[date_key] = [Number(item[date_key]), i]);
        data_recovered.forEach((item, i) => item[date_key] = [Number(item[date_key]), i]);
      }

      // combine all datasets into one
      // structure: [confirmed_value, confirmed_rank, deaths_value, deaths_rank, recovered_value, recovered_rank]
      sorted_combined_data = [...data];
      for (var i = 0; i < c19_number_of_dates; i++) {

        let date_key = c19_dates[i];

        console.log("COMBINED DATA ITEM, date_key : " + date_key);
        sorted_combined_data.forEach((item, index) => {
          item[date_key] = item[date_key].concat(data_deaths[index][date_key], data_recovered[index][date_key], -1, -1, -2, -2);
        });
      }


      // iterate over each date and sort data items based on the value in the date column
      // assign the rank to each value - and put it in the tuple: [ value, rank ]
      // calculate total numer of cases across locations for that date
      for (var i = 0; i < c19_number_of_dates; i++) {

        //break;

        let date_key = c19_dates[i];
        let prev_date_key = c19_dates[0];
        if (i != 0)
          prev_date_key = c19_dates[i - 1];

        // sort confirmed first and assign rank
        sorted_combined_data.sort((a, b) => d3.ascending(a[date_key][0], b[date_key][0]));
        sorted_combined_data.forEach((d, i) => (d[date_key][1] = i));

        // sort deaths
        sorted_combined_data.sort((a, b) => d3.ascending(a[date_key][2], b[date_key][2]));
        sorted_combined_data.forEach((d, i) => (d[date_key][3] = i));

        // sort recovered
        sorted_combined_data.sort((a, b) => d3.ascending(a[date_key][4], b[date_key][4]));
        sorted_combined_data.forEach((d, i) => (d[date_key][5] = i));

        //calculate daily confirmed cases
        sorted_combined_data.forEach((d, i) => {
          if (date_key === c19_dates[0]) {
            d[date_key][6] = d[date_key][0]
          }
          else {
            d[date_key][6] = d[date_key][0] - d[prev_date_key][0];
          }
          d[date_key][7] = i;
        });

        // sort daily confirmed cases
        sorted_combined_data.sort((a, b) => d3.ascending(a[date_key][6], b[date_key][6]));
        sorted_combined_data.forEach((d, i) => (d[date_key][7] = i));


        //calculate daily deaths
        sorted_combined_data.forEach((d, i) => {
          if (date_key === c19_dates[0]) {
            d[date_key][8] = d[date_key][2]
          }
          else {
            d[date_key][8] = d[date_key][2] - d[prev_date_key][2];
          }
          d[date_key][9] = i;
        });

        // sort daily confirmed cases
        sorted_combined_data.sort((a, b) => d3.ascending(a[date_key][8], b[date_key][8]));
        sorted_combined_data.forEach((d, i) => (d[date_key][9] = i));


        // calculate total confirmed cases for specific date
        let total_cases = 0;
        sorted_combined_data.forEach((d, i) => (total_cases += d[date_key][0]));
        c19_total_cases[i] = total_cases;

        // calculate total confirmed deaths for specific date
        let total_deaths = 0;
        sorted_combined_data.forEach((d, i) => (total_deaths += d[date_key][2]));
        c19_total_deaths[i] = total_deaths;

        // calculate total recovered cases for specific date
        let total_recovered = 0;
        sorted_combined_data.forEach((d, i) => (total_recovered += d[date_key][4]));
        c19_total_recovered[i] = total_recovered;
      }


      // INITIALIZE DATE and TOTAL CASES TO DAY ONE
      data_set = true;

      d3.select("#date_text").html(c19_dates[0]);
      d3.select("#glob_date_text").html("TOTALS  ON  " + c19_dates[0]);
      d3.select("#sel_loc_date_text").html("CASES  ON  " + c19_dates[0]);

      d3.select("#total_cases_text").html(c19_total_cases[0]);
      d3.select("#total_deaths_text").html(c19_total_deaths[0]);
      d3.select("#total_recovered_text").html(c19_total_recovered[0]);

      // CREATE 3D SCENE DATA OBJECTS
      SCENE_3D_addDataPoints(sorted_combined_data, c19_dates[0]).then((value) => (bars_3d_set = value));;

      // INITIALIZE CONFIRMED CASES BAR CHART
      initConfirmedBarChart(sorted_combined_data).then((value) => (bars_initialized = value));

      // INITIALIZE CALENDAR AND ITS ELEMENTS
      createCalendarSlider(c19_dates).then((value) => (calendar_set = value));

    });   // endif csv recovered load success
  });     // endif csv deaths load success
});       // endif csv confirmed load success


//
//  RACING BAR CHART
//

// d3 visual elements (svg elements)
var svg_con;                               // svg container for svg elements
svg_con = d3.select("#svg_con_element");
var con_bc_groups;                         // svg group elements that hold bars and text elements
var con_bc_bars;                           // svg rect elements that represent bars
var con_bc_values;                         // svg text elements - cases values
var con_bc_countries;                      // svg text elements - countries
var con_bc_provinces;                      // text elements - provinces

// d3 non-visual elements
var con_xScaleLog;
var con_xScaleLin;
var con_yScaleLin;

// bar chart visual parameters
var con_l_offset = 110;
var con_top_padding = 50;
var con_bottom_padding = 100;
var con_max_bar_width = 430;
var con_bc_height = -1;
var con_bar_height = 40;
var con_bar_padding = 2;

var con_transition_v = 1000; // transition time
var con_flip_value = 110;  // bar width treshold that drives the placement of province name

// text elements
var con_country_font_size = 12;
var con_province_font_size = 12;
var con_value_font_size = 16;


//
// INIT BAR CHART
//
let initConfirmedBarChart = async function (in_data) {

  // set at initial date
  let initial_date = c19_dates[0];
  let max_val_init_date = d3.max(in_data, d => Number(d[initial_date][0]));

  // calculate the total height of our bar chart
  let total_bc_height = (c19_number_of_places * con_bar_height) + (c19_number_of_places - 1) * con_bar_padding;
  // ...and the total height of svg container 
  let total_container_height = total_bc_height + con_top_padding + con_bottom_padding;
  svg_con.style("height", total_container_height + 'px');

  //some common layout stuff
  let c_offset = ~~(con_country_font_size / 2);
  let p_offset = ~~(con_province_font_size / 2);
  let v_offset = ~~(con_value_font_size / 2);

  //create scales
  // X LOG
  con_xScaleLog = d3.scaleLog()
    .base(Math.E)
    .clamp(true)
    .domain([0.1, max_val_init_date])
    .range([0, con_max_bar_width]);

  // X LINEAR
  con_xScaleLin = d3.scaleLinear()
    .domain([0.1, max_val_init_date])
    .range([0, con_max_bar_width]);

  // Y LINEAR
  con_yScaleLin = d3.scaleLinear()
    .domain([c19_number_of_places - 1, 0])
    .range([con_top_padding, con_top_padding + total_bc_height]);

  // create bar groups - they control vertical placement
  con_bc_groups = svg_con.selectAll('g')
    .data(in_data)
    .enter().append('g')
    .attr("transform", function (d) {
      let y_pos = con_yScaleLin(d[initial_date][1]);
      return "translate(" + String(con_l_offset) + "," + String(y_pos) + ")";
    })

  svg_con.selectAll('g').append('rect');

  // create rect bars
  con_bc_bars = svg_con.selectAll('rect')
    .data(in_data)
    .attr('y', 0)
    .attr('x', 0)
    .attr('width', function (d) {
      if (d[initial_date][0] === 0.0)
        return 3;
      if (use_log == true)
        return con_xScaleLog(d[initial_date][0]);
      else
        return con_xScaleLog(d[initial_date][0]);
    })
    .attr('height', con_bar_height - con_bar_padding)
    .attr('fill', d => d.colour)
    .attr('id', (d, i) => "bar_id_" + i)
    .on("click", function () {
      let clicked_bar_id = d3.select(this).attr("id").substr(7);
      console.log("CLICKED BAR: " + clicked_bar_id);
      eventDISPATCH(undefined, clicked_bar_id, undefined, undefined);
    });


  // create countries text
  con_bc_countries = svg_con.selectAll('g').append('text')
    .attr('class', 'con-country-txt')
    .style('font-size', con_country_font_size + "px")
    //.style( 'fill', "white")
    .attr('text-anchor', 'end')

  // ..and append two spans for country names - split in two if name is more than one word
  con_bc_countries.data(in_data)
    .append('tspan')
    .attr('x', -5).attr('y', con_bar_height / 2 + c_offset - con_bar_padding).attr('dy', 0 - c_offset)
    .text(function (d) {
      let c_s = String(d["Country/Region"]);
      let space_pos = c_s.indexOf(' ');
      return c_s.substring(0, space_pos);
    })

  con_bc_countries.data(in_data)
    .append('tspan')
    .attr('x', -5).attr('y', con_bar_height / 2 + c_offset - con_bar_padding).attr('dy', 0 + c_offset)
    .text(function (d) {
      let c_s = String(d["Country/Region"]);
      let space_pos = c_s.indexOf(' ');
      return c_s.substring(space_pos + 1);
    })

  // create provinces text
  con_bc_provinces = svg_con.selectAll('g').append('text')
    .attr('class', 'con-province-txt')
    .attr('transform', function (d) {
      if (con_xScaleLog(d[initial_date][0]) < con_flip_value)
        return 'translate(' + con_xScaleLog(d[initial_date][0]) + ',0)'; // if bar is not wide enough for porvince text, move text to the right side of the bar
      return 'translate(0,0)';
    })
    .style('font-size', con_province_font_size + "px")
    .attr('text-anchor', 'start')

  // ...and append two spans for province names - split in two if name is more than one word
  con_bc_provinces.data(in_data)
    .append('tspan')
    .attr('x', 5).attr('y', con_bar_height / 2 + p_offset - con_bar_padding).attr('dy', -p_offset)
    .text(function (d) {
      let c_s = String(d["Province/State"]);
      let ws_c = c_s.split(" ").length - 1
      let space_pos = c_s.indexOf(' ');
      if (ws_c > 2) {
        space_pos = c_s.indexOf(' ', space_pos + 1);
      }
      return c_s.substring(0, space_pos);
    })

  con_bc_provinces.data(in_data)
    .append('tspan')
    .attr('x', 5).attr('y', con_bar_height / 2 + p_offset - con_bar_padding).attr('dy', +p_offset)
    .text(function (d) {
      let c_s = String(d["Province/State"]);
      let ws_c = c_s.split(" ").length - 1
      let space_pos = c_s.indexOf(' ');
      if (ws_c > 2) {
        space_pos = c_s.indexOf(' ', space_pos + 1);
      }
      return c_s.substring(space_pos + 1);
    })

  // create values text
  con_bc_values = svg_con.selectAll('g').append('text')
    .attr('class', 'con-value-txt')
    .style('font-size', con_value_font_size + "px")
    .attr('y', con_bar_height / 2 + v_offset - con_bar_padding)
    .attr('text-anchor', 'end')
    .style("opacity", function (d) {
      let c_value = d[initial_date][0];
      if (c_value < 1.0)
        return "0";
      else
        return "1";
    })

  con_bc_values.data(in_data)
    .attr('x', function (d) {
      if (d[initial_date][0] === 0.0)
        return 1;
      if (use_log == true)
        return con_xScaleLog(d[initial_date][0]) - con_bar_padding * 2;
      else
        return con_xScaleLog(d[initial_date][0]) - con_bar_padding * 2;
    })
    .text(d => d[initial_date][0])

  return true;

  //console.log("TAG group: " + con_bc_groups.node().tagName);
  //console.log("TAG rect: " + con_bc_bars.node().tagName);
  //console.log("TAG rect: " + con_bc_countries.node().tagName);
}

//
//  UPDATE BARS WHEN DATE CHANGES
//

function updateConfirmedBarChart(in_data, in_index, in_table) {

  let changed_date = c19_dates[in_index];

  console.log("TABLE: " + in_table)

  let rank_index = in_table * 2 + 1;
  let value_index = in_table * 2;

  let max_value_sel_date = d3.max(in_data, d => Number(d[changed_date][0]))
  console.log("CONFIRMED: " + max_value_sel_date);

  let max_deaths_value_del_date = d3.max(in_data, d => Number(d[changed_date][2]))
  console.log("deaths: " + max_deaths_value_del_date);

  let max_recovered_value_del_date = d3.max(in_data, d => Number(d[changed_date][4]))
  console.log("recovereed: " + max_recovered_value_del_date);

  let max_daily_con_value_sel_date = d3.max(in_data, d => Number(d[changed_date][6]))
  console.log("daily confirmed: " + max_daily_con_value_sel_date);

  let max_daily_death_value_sel_date = d3.max(in_data, d => Number(d[changed_date][8]))
  console.log("daly deaths: " + max_daily_death_value_sel_date);

  /*
    if (d[initial_date][0] === 0.0)
    return 3;
  if (use_log == true)
    return con_xScaleLog(d[initial_date][0]);
  else
    return con_xScaleLog(d[initial_date][0]);
  
  */
  // update scales according to the biggest value on the changed day
  switch (in_table) {
    case 0: {
      use_log = true;
      con_xScaleLog.domain([0.1, max_value_sel_date])
        .range([0, con_max_bar_width]);
      con_xScaleLin.domain([0.1, max_value_sel_date])
        .range([0, con_max_bar_width]);
      break;
    }
    case 1: {
      use_log = true;
      con_xScaleLog.domain([0.1, max_deaths_value_del_date])
        .range([0, con_max_bar_width]);
      con_xScaleLin.domain([0.1, max_deaths_value_del_date])
        .range([0, con_max_bar_width]);
      break;
    }
    case 2: {
      use_log = true;
      con_xScaleLog.domain([0.1, max_recovered_value_del_date])
        .range([0, con_max_bar_width]);
      con_xScaleLin.domain([0.1, max_recovered_value_del_date])
        .range([0, con_max_bar_width]);
      break;
    }
    case 3: {
      use_log = true;
      con_xScaleLog.domain([0.1, max_daily_con_value_sel_date])
        .range([0, con_max_bar_width]);
      con_xScaleLin.domain([0.1, max_daily_con_value_sel_date])
        .range([0, con_max_bar_width]);
      break;
    }
    case 4: {
      use_log = true;
      con_xScaleLog.domain([0.1, max_daily_death_value_sel_date])
        .range([0, con_max_bar_width]);
      con_xScaleLin.domain([0.1, max_daily_death_value_sel_date])
        .range([0, con_max_bar_width]);
      break;
    }
  }

  // change width
  con_bc_bars.transition().ease(d3.easeLinear).duration(con_transition_v)
    .attr('width', function (d) {
      if (d[changed_date][value_index] === 0.0)
        return 3;
      if (use_log == true)
        return con_xScaleLog(d[changed_date][value_index]);
      else
        return con_xScaleLin(d[changed_date][value_index]);
    })

  // update bar y position according to the rank on the changed day
  con_bc_groups.transition().ease(d3.easeLinear).duration(con_transition_v)
    .attr("transform", function (d) {
      let y_pos = con_yScaleLin(d[changed_date][rank_index]);
      return "translate(" + String(con_l_offset) + "," + String(y_pos) + ")";
    })

  // don't display text if value is zero
  con_bc_values.style("opacity", function (d) {
    let c_value = d[changed_date][value_index];
    if (c_value < 1.0)
      return "0";
    else
      return "1";
  })

  // update x postion of province name if the name does not fit in the bar width
  con_bc_provinces.transition().ease(d3.easeLinear).duration(con_transition_v)
    .attr('transform', function (d) {
      let b_width = con_xScaleLog(d[changed_date][value_index]);
      if (b_width < con_flip_value)
        return 'translate(' + b_width + ',0)'; // if bar is not wide enough for porvince text, move text to the right side of the bar
      return 'translate(0,0)';
    })


  // update postions and texts of values  
  con_bc_values
    .transition().ease(d3.easeLinear).duration(con_transition_v)
    .attr('x', d => {
      if (use_log == true)
        return con_xScaleLog(d[changed_date][value_index]) - con_bar_padding * 2
      else
        return con_xScaleLin(d[changed_date][value_index]) - con_bar_padding * 2
    })
    .tween("text", function (d) {
      let start = d3.select(this).text();
      let end = d[changed_date][value_index];

      var interpolator = d3.interpolateNumber(start, end); // d3 interpolator
      return function (t) { d3.select(this).text(Math.round(interpolator(t))) };
    });
}


//
//  CALENDAR SLIDER
//

var calendar_day_cell_w = 40;
var calendar_day_cell_h = 40;
var all_cal_dates;

// CREATE CALENDAR ELEMENTS
let createCalendarSlider = async function (dates_array) {

  let month = -1;
  let year = -2020;
  let day_counter = 0;

  dates_array.forEach((d, i) => {

    //console.log(d);

    let date_split = d.split("/");

    // add month+year rectangle and text
    if (month != date_split[0]) {

      month = date_split[0]

      day_counter = 0;
      day_counter++;

      let month_grp = cal_svg.append('g')
        .attr("transform", "translate(" + i * calendar_day_cell_w + "," + calendar_day_cell_h * 0 + ")");

      month_grp.append('rect')
        .attr('y', 0)
        .attr('x', 0)
        .attr('height', calendar_day_cell_w)
        .attr('width', calendar_day_cell_w)
        .attr('class', 'cal-day')
        .attr("id", "cal_mon_" + date_split[0] + "_year_" + date_split[2]);

      month_grp.append('text')
        .attr('y', calendar_day_cell_h / 2 + 5)
        .attr('x', calendar_day_cell_w / 2)
        .attr('class', 'province_label')
        .attr('text-anchor', 'middle')
        .text(date_split[0])
        .attr("id", "text_cal_mon_" + date_split[0] + "_year_" + date_split[2]);
    }
    else {
      day_counter++;
      cal_svg.select('#' + "cal_mon_" + date_split[0] + "_year_" + date_split[2]).attr('width', day_counter * calendar_day_cell_w)
      cal_svg.select('#' + "text_cal_mon_" + date_split[0] + "_year_" + date_split[2]).attr('x', day_counter * calendar_day_cell_w / 2)
    }

    // add day elements: group element that holds rect element and text element
    let date_i_g = cal_svg.append('g')    // group
      .attr("transform", "translate(" + i * calendar_day_cell_w + "," + calendar_day_cell_h * 1 + ")")
      .attr("id", "g_cal_" + String(d));

    date_i_g.append('rect')   // rect
      .attr('y', 0)
      .attr('x', 0)
      .attr('height', calendar_day_cell_w)
      .attr('width', calendar_day_cell_h)
      .attr('class', 'cal-day')
      .attr("id", "cal_" + d)
      .on('click', function (d, i) {
        let id_ = d3.select(this).attr("id");
        console.log(id_)
      })
      .on('mouseover', function (d) {
        d3.select(this)
          .attr('class', 'cal-day-sel')
      })
      .on('mouseout', function (d) {
        d3.select(this)
          .attr('class', 'cal-day')
      })
      .on("click", function () {
        let clicked_id = d3.select(this).attr("id").substr(4); //date
        let parent_xpos = d3.select(this.parentNode).attr('transform').split("(")[1].split(",")[0]; //marker postion

        eventDISPATCH(clicked_id, undefined, parent_xpos, undefined);
      });

    date_i_g.append('text')   // text
      .attr('y', calendar_day_cell_h / 2 + 5)
      .attr('x', calendar_day_cell_w / 2)
      .attr('class', 'province_label')
      .attr('text-anchor', 'middle')
      .text(date_split[1]);

    // expand calendar wrap svg element
    cal_svg.attr('width', calendar_day_cell_w + i * calendar_day_cell_w);
    cal_svg.attr('height', calendar_day_cell_h * 2);
  });

  selected_date_marker = cal_svg.append('rect')
    .attr('y', calendar_day_cell_h)
    .attr('x', 0)
    .attr("id", "cal_selected_date")
    .attr('fill', "transparent")
    .attr("stroke-width", "2px")
    .attr("stroke", "white")
    .attr('height', calendar_day_cell_w)
    .attr('width', calendar_day_cell_h)

  return true;
}


//
// GLOBAL SELECTIONS
//

var selected_place_index = -1;  // no selected places initally
var selected_date = "1/22/20";  //initial value
var x_position = 0;             //initial value
var selected_table = 0.0;         //confirmed table

// event dipatch function
function eventDISPATCH(in_date, in_index, in_x_pos, in_table) {

  // exit if none of the visual elements is set
  if (!bars_3d_set && !bars_initialized && !calendar_set)
    return

  if (in_index != undefined)
    selected_place_index = in_index;
  if (in_date != undefined)
    selected_date = in_date;
  if (in_x_pos != undefined)
    x_position = in_x_pos;
  if (in_table != undefined)
    selected_table = in_table;

  console.log(selected_date);

  changeGlobalDate(selected_date);
  markSelectedCalendarDate(x_position);

  changeClickedCountryProvince(selected_place_index, selected_date);

  updateConfirmedBarChart(sorted_combined_data, c19_dates.indexOf(selected_date), selected_table);

  // global data
  d3.select("#total_cases_text").html(c19_total_cases[c19_dates.indexOf(selected_date)]);
  d3.select("#total_deaths_text").html(c19_total_deaths[c19_dates.indexOf(selected_date)]);
  d3.select("#total_recovered_text").html(c19_total_recovered[c19_dates.indexOf(selected_date)]);
}

function markSelectedCalendarDate(x_pos) {
  selected_date_marker.attr('x', x_pos);
}

function changeGlobalDate(date) {
  d3.select("#date_text").html(date);
  d3.select("#glob_date_text").html("TOTALS  ON  " + date);
  d3.select("#sel_loc_date_text").html("CASES  ON  " + date);

  SCENE_3D_updateDataPoints(sorted_combined_data, date, selected_table); // TO-DO: implement this better
}

function changeClickedCountryProvince(index, date) {
  if (index === -1)
    return;
  let selected_country = sorted_combined_data[index]["Country/Region"];
  let selected_province = sorted_combined_data[index]["Province/State"];

  let selected_cases = sorted_combined_data[index][date][0];
  let selected_deaths = sorted_combined_data[index][date][2];
  let selected_recovered = sorted_combined_data[index][date][4];

  let selected_daily_confirmmed = sorted_combined_data[index][date][6];
  let selected_daily_deaths = sorted_combined_data[index][date][8];

  d3.select("#country_text").html(selected_country);
  d3.select("#province_text").html(selected_province);

  d3.select("#cases_text").html(selected_cases + " " + "(+" + selected_daily_confirmmed + ")");
  d3.select("#deaths_text").html(selected_deaths + " " + "(+" + selected_daily_deaths + ")");
  d3.select("#recovered_text").html(selected_recovered);

  SCENE_3D_UPDATE_SELECTION_RING(sorted_combined_data, index);
}

//
//  SYSTEM/DOCUMENT EVENTS
//

// arrow keys event listener
document.addEventListener('keydown', logKey);

var dataset_name = ["DATASET:   TOTAL CONFIRMED", "DATASET:   TOTAL DEATHS", "DATASET:   TOTAL RECOVERED", "DATASET:   DAILY CONFIRMED", "DATASET:   DAILY DEATHS"];
d3.select("#temp-info-text").text(dataset_name[0]);



function logKey(e) {
  //let date_index = c19_dates.indexOf(selected_date);

  if (e.code === "ArrowRight") {
    let date_index = c19_dates.indexOf(selected_date);
    date_index != (c19_number_of_dates - 1) ? ++date_index : date_index = date_index;
    let new_selected_date = c19_dates[date_index];
    eventDISPATCH(new_selected_date, undefined, (date_index * calendar_day_cell_w), undefined)
  }


  if (e.code === "ArrowLeft") {
    let date_index = c19_dates.indexOf(selected_date);
    date_index != 0 ? --date_index : date_index = date_index = date_index;
    let new_selected_date = c19_dates[date_index];
    eventDISPATCH(new_selected_date, undefined, (date_index * calendar_day_cell_w), undefined)
  }

  if (e.code === "ArrowUp") {
    let new_selected_table = (++selected_table) % 5;

    d3.select("#temp-info-text").text(dataset_name[new_selected_table]);

    eventDISPATCH(undefined, undefined, undefined, new_selected_table)
  }

  if (e.code === "ArrowDown") {
    let new_selected_table;
    if ((selected_table - 1) < 0)
      new_selected_table = 4;
    else
      new_selected_table = selected_table - 1;

    d3.select("#temp-info-text").text(dataset_name[new_selected_table]);

    eventDISPATCH(undefined, undefined, undefined, new_selected_table)
  }
}
