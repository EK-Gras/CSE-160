// DrawTriangle.js (c) 2012 matsuda
var v1 = new Vector3([0, 0, 0]);
var v2 = new Vector3([0, 0, 0]);
var v3 = new Vector3([0, 0, 0]);
var v4 = new Vector3([0, 0, 0]);

function drawVector(v, color) {
  var canvas = document.getElementById('canvas'); 
  var ctx = canvas.getContext('2d');

  var center_x = canvas.width / 2;
  var center_y = canvas.height / 2;
  

  ctx.beginPath();
  ctx.moveTo(200, 200);
  ctx.strokeStyle = color;
  ctx.lineTo(center_x + (v.elements[0] * 20), center_y - (v.elements[1] * 20));
  ctx.stroke();
}

function main() {  
  // Retrieve <canvas> element
  var canvas = document.getElementById('canvas');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');

  // Draw a black rectangle
  ctx.fillStyle = "black"; // Set color to BLACK
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill a rectangle with the color

  drawVector(v1, "red");
  drawVector(v2, "blue");
  drawVector(v3, "green");
  drawVector(v4, "green");
}

function handleDrawEvent() {
  var v1x = document.getElementById("v1x").value;
  var v1y = document.getElementById("v1y").value;

  v1 = new Vector3([v1x, v1y, 0]);

  var v2x = document.getElementById("v2x").value;
  var v2y = document.getElementById("v2y").value;

  v2 = new Vector3([v2x, v2y, 0]);

  main();
}

function angle(other1, other2) {
  var a = (180 * Math.acos(Vector3.dot(other1, other2) / (other1.magnitude() * other2.magnitude()))) / Math.PI;
  return a;
}

function areaTriangle(other1, other2) {
  var a = Vector3.cross(other1, other2).magnitude() / 2;
  return a;
}

function handleDrawOperationEvent() {
  var operation = document.getElementById("operation-select").value;
  var scalar = document.getElementById("scalar").value;

  v3 = new Vector3([0, 0, 0]);
  v4 = new Vector3([0, 0, 0]);
  
  switch (operation) {
    case "add":
      v3.set(v1);
      v3.add(v2);
      main();
      break;
    case "sub":
      v3.set(v1);
      v3.sub(v2);
      main();
      break;
    case "div":
      v3.set(v1);
      v3.div(scalar);
      main();
      break;
    case "mul":
      v3.set(v1);
      v3.mul(scalar);
      main();
      break;
    case "magnitude":
      console.log("Magnitude v1: " + v1.magnitude());
      console.log("Magnitude v2: " + v2.magnitude());
      break;
    case "normalize":
      v3.set(v1);
      v3.normalize();
      v4.set(v2);
      v4.normalize();
      main();
      break;
    case "angle":
      var a = angle(v1, v2);
      console.log("Angle: " + a);
      break;
    case "area":
      var a = areaTriangle(v1, v2);
      console.log("Area: " + a);
      break;
  }
}