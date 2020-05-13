//load data
function loadData(){

	Promise.all([
      d3.json("data/us_cont_states.topojson"),
      d3.json("data/departamentos.topojson"),
      d3.json("data/countries.geojson"),
      d3.csv("data/remittance_source_destination.csv"),
      d3.csv("data/remittance_single.csv"),
    ])
    .then(function([states_topojson,departamentos_topojson,countries_geojson,remittance_csv,rem_single_csv]){

      var states = topojson.feature(states_topojson, states_topojson.objects.states);
      var departamentos = topojson.feature(departamentos_topojson, departamentos_topojson.objects.departamentos);
      // var countries = topojson.feature(countries_topojson, countries_topojson.objects.countries).features;
      var remittances = remittance_csv;
      var singleRemittance = rem_single_csv;
      var countries = countries_geojson.features;

      //format and draw sankey
       // var formatted = formatSankeyData(remittances);
       var formatted = formatSankeyData(singleRemittance)
       drawSankey(formatted);

       //format and draw map
       // var mapFlows = formatMapLinks(remittances);
       initializeMap(states,departamentos,formatted,countries);

       //add control to switch between sankey and map
       setupButtons();
	})

}

// function formatMapLinks(rawData){

//   var formatted = [];

//   //add links
//   for(var state of rawData){
//       //loop through departments
//       for(var property in state){
//         if(property != "sender"){
//           var value = +state[property].replace(/,/g,"");
//           if(value !=0){
//             formatted.push({
//               "source": state.sender,
//               "target": property,
//               "value": value
//             })
//           }
//         }
//       }
//   }
//   return formatted;
// }

function formatSankeyData(rawData){

  var formatted = {
    "nodes": [],
    "links": []
  }

  //add states as nodes
  for(var state of rawData){
    formatted.nodes.push({
      "name": state.sender
    })
  }
  //add departments as nodes
  for(var department of rawData.columns){
    if(department != "sender"){
      formatted.nodes.push({
      "name": department
    })
    }
  }

  //add links
  for(var state of rawData){
      //loop through departments
      for(var property in state){
        if(property != "sender"){
          var value = +state[property].replace(/,/g,"");
          if(value !=0){
            formatted.links.push({
              "source": state.sender,
              "target": property,
              "value": value
            })
          }
        }
      }
  }
  return formatted;
}

function drawSankey(data) {

  // set the dimensions and margins of the graph
  var margin = {top: 10, right: 10, bottom: 10, left: 10},
      width = window.innerWidth - margin.left - margin.right,
      height = window.innerHeight*0.95 - margin.top - margin.bottom;

      if(width>700) width = 700;

  // append the svg object to the body of the page
  var svg = d3.select(".graphic-container").append("svg")
      .attr("class", "sankey")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


  var padding = 10;

  // Set the sankey diagram properties
  var sankey = d3.sankey()
    .nodeId(d => d.name)
    .nodeAlign(d3.sankeyRight)
    //.nodeSort(null)
    .nodeWidth(15)
    .nodePadding(padding)
    .extent([[0, 5], [width, height - 5]]);


  const {nodes, links} = sankey({
    nodes: data.nodes,
    links: data.links
  });


  svg.append("g")
    .selectAll("rect")
    .data(nodes)
    .join("rect")
      .attr("x", d => d.x0 + 1)
      .attr("y", d => d.y0)
      .attr("height", d => d.y1 - d.y0)
      .attr("width", d => d.x1 - d.x0 - 2)
      .attr("fill", "#4b7fab")
    .append("title")
      .text(d => `${d.name}\n${d.value.toLocaleString()}`);

  const link = svg.append("g")
      .attr("fill", "none")
    .selectAll("g")
    .data(links)
    .join("g")
      .attr("stroke", "#4b7fab")
      .style("mix-blend-mode", "multiply");

  link.append("path")
      .attr("class", d=> d.source.name.replace(/ /g,"_") + " sankeyFlow")
      .attr("id", d=> d.target.name.replace(/ /g,"_"))
      .on("mouseover", function(d){
        d3.selectAll(".sankeyFlow").classed("dehighlight", true);
        var left = d3.mouse(this)[0] < width/2;
        if(left){
          d3.selectAll("."+d.source.name.replace(/ /g,"_")).classed("dehighlight", false).classed("highlight", true)
        } else {
          d3.selectAll("#"+d.target.name.replace(/ /g,"_")).classed("dehighlight", false).classed("highlight", true)
        }
      })
      .on("mouseout", function(d){
          d3.selectAll(".sankeyFlow").classed("dehighlight", false);
          d3.selectAll(".highlight").classed("highlight", false);
      })
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke-width", d => Math.max(0.5, d.width))
      .attr("stroke-opacity", 0.2);

  link.append("title")
      .text(d => `${d.source.name} → ${d.target.name}\n${d.value.toLocaleString()}`);

  svg.append("g")
      .style("font", "10px sans-serif")
    .selectAll("text")
    .data(nodes)
    .join("text")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", d => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .text(d => d.name)
      .on("mouseover", function(d){
        d3.selectAll(".sankeyFlow").classed("dehighlight", true);
        var left = d3.mouse(this)[0] < width/2;
        if(left){
          d3.selectAll("."+d.name.replace(/ /g,"_")).classed("dehighlight", false).classed("highlight", true)
        } else {
          d3.selectAll("#"+d.name.replace(/ /g,"_")).classed("dehighlight", false).classed("highlight", true)
        }
      })
      .on("mouseout", function(d){
        d3.selectAll(".sankeyFlow").classed("dehighlight", false);
        d3.selectAll(".highlight").classed("highlight", false);
      })
    .append("tspan")
      .attr("fill-opacity", 0.7)
      .text(d => ` ${d.value.toLocaleString()}`);


}

function initializeMap(states,departamentos,formatted,countries){

  // set the dimensions and margins of the graph
  var margin = {top: 0, right: 10, bottom: 10, left: 0},
      width = window.innerWidth - margin.left - margin.right,
      height = window.innerHeight*0.95 - margin.top - margin.bottom;

  if(width>700) width = 700;

  //create usa projection
  const albersUsa = d3.geoConicEqualArea()
                    .parallels([29.5, 45.5])
                    .rotate([96, 0]) //center longitude
                    .center([0,38.7]); //center latitude

  //path generator
  const pathUsa = d3.geoPath()
                 .projection(albersUsa);

  albersUsa.fitExtent([[margin.left,margin.top],[margin.left+width, margin.top+height/2-10]], states);

  //create guatemalaprojection
  const centerLocation = {
      "longitude": -90.2299,
      "latitude": 15.7779
  };
  //albers centered on guatemala
  const albersGuate = d3.geoConicEqualArea()
                      .parallels([14.8,16.8]) 
                      .rotate([centerLocation["longitude"]*-1,0,0]) //center longitude
                      .center([0,centerLocation["latitude"]]); //center latitude

  albersGuate.fitExtent([[margin.left,margin.top+height/2+10],[margin.left+width, margin.top+height]], departamentos);

  //path generator
  const pathGuate = d3.geoPath()
                 .projection(albersGuate);

  //add map svg
  var svg = d3.select(".graphic-container").append("svg")
      .attr("class", "map")
      .attr("display", "none") //start with sankey by default
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //draw guatemala departamentos
   svg.append("g")
          .attr("class", "guate")
    .selectAll(".municipio")
              .data(departamentos.features)
              .enter()
              .append("path")
                  .attr("d", pathGuate)
                  .attr("class", "municipio")
                  .attr("id", d=>d.properties.name.replace(/ /g,""))
                  .on("mouseover", function(d){
                    d3.selectAll(".mapFlow").classed("dehighlight",true);
                    //move state to top of drawing order
                    d3.select(this).raise();
                    //highlight state
                    d3.select(this).style("stroke", "#000").style("stroke-width", "1px");
                    //highlight flow arrows
                    d3.selectAll("#flow"+d.properties["name"].replace(/ /g,"_")).classed("dehighlight",false).classed("highlight", true); 
                  })
                  .on("mouseout", function(d){
                    d3.selectAll(".mapFlow").classed("dehighlight",false);
                    //dehighlight state
                    d3.select(this).style("stroke", "#fff").style("stroke-width", "0.25px");
                    //dehighlight flow arrows
                    d3.selectAll(".highlight").classed("highlight", false);
                  });

  // //draw usa states
  //  svg.append("g")
  //         // .attr("class","usa")
  //   .selectAll(".state")
  //             .data(states.features)
  //             .enter()
  //             .append("path")
  //                 .attr("d", pathUsa)
  //                 .attr("class", "state")
  //                 .attr("id", d=>d.properties.name.replace(/ /g,""))
  //                 .on("mouseover", function(d){
  //                   d3.selectAll(".mapFlow").classed("dehighlight",true);
  //                   //move state to top of drawing order
  //                   d3.select(this).raise();
  //                   //highlight state
  //                   d3.select(this).style("stroke", "#000").style("stroke-width", "1px");
  //                   //highlight flow arrows
  //                   d3.selectAll(".flow"+d.properties["name"].replace(/ /g,"_")).classed("dehighlight",false).classed("highlight", true); 
  //                 })
  //                 .on("mouseout", function(d){
  //                   d3.selectAll(".mapFlow").classed("dehighlight",false);
  //                   //dehighlight state
  //                   d3.select(this).style("stroke", "#fff").style("stroke-width", "0.25px");
  //                   //dehighlight flow arrows
  //                   d3.selectAll(".highlight").classed("highlight", false);
                  // });

console.log(countries);
  //draw united states
  svg.append("g")
        .selectAll(".usa")
        .data(countries.filter(d=>d.properties["NAME"] == "United States of America"))
        .enter()
        .append("path")
            .attr("class", "country")
            .attr("d", pathUsa)
            .attr("id", d=>d.properties["NAME"].replace(/ /g,""));

  //scale for flows
  var wScale = d3.scaleLinear()
              .domain(d3.extent(formatted.links.map(link=>link.value)))
              .range([0,10]);

  //format map flows
  var mapFlows = formatMapFlows(formatted,svg,pathUsa,pathGuate,wScale,albersUsa);


  //create map flow generator
  function verticalSource(d) {
  return d.origin;
}

  function verticalTarget(d) {
  return d.destination;
}

  var mapLinkVertical = d3.linkVertical()
                            .source(verticalSource)
                            .target(verticalTarget);

  //add flows
  const link = svg.append("g")
      .attr("fill", "none")
    .selectAll("g")
    .data(mapFlows)
    .join("g")
      .attr("stroke", "#4b7fab")
      .style("mix-blend-mode", "multiply");

  link.append("path")
      .attr("class", d=> "mapFlow flow"+ d.source["name"].replace(/ /g,"_"))
      .attr("id", d=> "flow"+ d.target["name"].replace(/ /g,"_"))
      .attr("d", mapLinkVertical)
      .attr("stroke-width", d => Math.max(0.5, d.width))
      // .attr("stroke-opacity", 0.2)
      .attr("stroke-opacity", 1)
      .attr("pointer-events", "none");

}

function setupButtons(){

  d3.selectAll(".toggle span").on("click", function(d){
      //take off bold for both
      d3.selectAll(".toggle span").classed("active", false)
      //set bold for clicked
      d3.select(this).classed("active", true);
      var target = d3.select(this).text().toLowerCase();
      //make both invisible
      d3.selectAll(".graphic-container svg").style("display", "none");
      d3.selectAll(".sankey").style("display", "none");
      //make target visible
      d3.selectAll(`.${target}`).style("display", "block");
  })


}

function formatMapFlows(formatted,svg,pathUsa,pathGuate,wScale,albersUsa){

  console.log(formatted.links[0]);
  //calculate origins and destinations so we can sort
  for(var link of formatted.links){
       //get reference to source and calc centroid
      var source = svg.select(`#${link.source["name"].replace(/ /g,"")}`).datum();
      // link.origin = pathUsa.centroid(source)
      link.origin = albersUsa([-98.5795,39.8283])
       //same for target
      var target = svg.select(`#${link.target["name"].replace(/ /g,"")}`).datum();
      link.destination = pathGuate.centroid(target);
  }
 

  // Use sankey to adjust origin and destination points without overlap
  var sankey = d3.sankey()
    .nodeId(d => d.name)
    //.nodeSort(null)
    .nodeAlign(d3.sankeyRight)
    .nodeWidth(15)
    .nodePadding(5)
    .extent([[0, 5], [10, 10 - 5]]);


  const {nodes, links} = sankey({
    nodes: formatted.nodes,
    links: formatted.links
  });

  //sort to minimize collisions
  for(var link of links){
      link.source.sourceLinks.sort(function(a,b){
        return a.destination[0] - b.destination[0]
      })
      link.target.targetLinks.sort(function(a,b){
        return a.origin[0] - b.origin[0];
      })
  }

  //get base position of flows  
  for(var link of links){
      //calculate width based on our scale
      // link.width = Math.max(wScale(link.value),0.5)
      link.width = wScale(link.value)
      //calculate total width for source
      var originWidth = wScale(link.source.value);
      //calc total width for destination
      var destinationWidth = wScale(link.target.value);

      //calculate source width already added
      //index of current link with sourceLinks
      var i = link.source.sourceLinks.map(sourceLink=>sourceLink.index).indexOf(link.index);
      // console.log(i);
      var precedingOriginWidth = 0;
      for(var j = 0; j < i; j++){
        precedingOriginWidth += wScale(link.source.sourceLinks[j].value)
      }
      //calculate destination width already added
      //index of current link with destinationLinks
      var i = link.target.targetLinks.map(targetLink=>targetLink.index).indexOf(link.index);
      var precedingDestinationWidth = 0;
      for(var j = 0; j < i; j++){
        precedingDestinationWidth += wScale(link.target.targetLinks[j].value)
      }
      
      //adjust x using total and preceding width
      link.origin[0] = link.origin[0] - originWidth/2 + precedingOriginWidth + link.width/2;
      //adjust x using total and preceding width
      link.destination[0] = link.destination[0] - destinationWidth/2 + precedingDestinationWidth + link.width/2;
  }

  console.log(links)
  return links;


 }


//start things off
loadData();

