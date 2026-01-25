// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }
  `;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
  `;

var canvas;
var gl;
var a_Position;
var u_FragColor;
var u_Size

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

var g_selectedColor = [1.0, 1.0, 1.0, 1.0];
var g_selectedSize = 5;
var g_selectedType = 'square';
var g_selectedSegmentCount = 12;

function addActionsForHtmlUI() {
  
  // Button Events
  document.getElementById('clearButton').addEventListener("mouseup", function() { 
    g_shapesList = [];
    renderAllShapes();
  });
  document.getElementById('squareButton').addEventListener("mouseup", function() { g_selectedType = 'square'; });
  document.getElementById('triangleButton').addEventListener("mouseup", function() { g_selectedType = 'triangle'; });
  document.getElementById('circleButton').addEventListener("mouseup", function() { g_selectedType = 'circle'; });
  document.getElementById('vertexButton').addEventListener("mouseup", function() { g_selectedType = 'vertex'; });

  document.getElementById('pictureButton').addEventListener("mouseup", drawPicture);

  // Slide Events
  document.getElementById('redSlide').addEventListener("mouseup", function() { g_selectedColor[0] = this.value/100; });
  document.getElementById('greenSlide').addEventListener("mouseup", function() { g_selectedColor[2] = this.value/100; });
  document.getElementById('blueSlide').addEventListener("mouseup", function() { g_selectedColor[1] = this.value/100; });

  document.getElementById('sizeSlide').addEventListener("mouseup", function() { g_selectedSize = this.value; });
  document.getElementById('segmentSlide').addEventListener("mouseup", function() { g_selectedSegmentCount = this.value; });
}

function main() {
  // Get the canvas from the HTML document and the WebGL context
  setupWebGL();

  // Get the a_Position and u_FragColor attributes from the WebGL context and initialize GLSL shaders
  connectVariablesToGLSL();

  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousemove = function(ev) {
    if (ev.buttons == 1 && g_selectedType != 'vertex') 
      click(ev);
  };

  canvas.onmousedown = function(ev) {
    if (g_selectedType == 'vertex') {
      pushVertex(ev);
    }
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return [x, y];
}

function renderAllShapes() {
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Get the length of the shapes list
  var len = g_shapesList.length;

  // For each element in the shape list determining the properties of each point on the canvas...
  for(var i = 0; i < len; i++) {
    // Get the coordinates, color, and size at index i
    var shape = g_shapesList[i];
    shape.render()
  }
}

var g_shapesList = [];

// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = [];   // The array to store the size of a point
function click(ev) {

  // Extract the x, y coordinates where we want to put our shape from the click event
  var [x, y] = convertCoordinatesEventToGL(ev);

  var newShape;

  switch (g_selectedType) {
    case 'square':
      newShape = new Square();
      break;
    case 'triangle':
      newShape = new Triangle();
      break;
    case 'circle':
      newShape = new Circle();
      break;
    default:
      return;
  }

  newShape.position = [x, y, 0.0];
  newShape.color = g_selectedColor.slice();
  newShape.size = g_selectedSize;

  g_shapesList.push(newShape);

  // Draw all shapes we've put in the canvas
  renderAllShapes();
}

var g_vertexList = [];

function pushVertex(ev) {
  // Extract x, y
  var [x, y] = convertCoordinatesEventToGL(ev);
  // Push these coords to the vertexList
  g_vertexList.push(x);
  g_vertexList.push(y);

  if (g_vertexList.length >= 6) {
    // Instantiate a VertexTriangle with the 3 vertices
    var newShape = new VertexTriangle();
    newShape.color = g_selectedColor.slice();
    newShape.vertices = g_vertexList.slice(0, 6);
    g_vertexList = [];

    // Add it to the list of shapes
    g_shapesList.push(newShape);

    // Draw!
    renderAllShapes();
  }
  
}

class Square{
  constructor() {
    this.type = 'square';
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
  }

  render() {
    var xy = this.position;
    var rgba = this.color;
    var s = this.size;

    // Signal the buffer that it will not be receiving an attribute
    gl.disableVertexAttribArray(a_Position);

    // Pass the position of the point to a_Position variable
    gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    // Pass the color of the point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    // Pass the size of the point to u_Size variable
    gl.uniform1f(u_Size, s);

    // Draw this point!
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

class Triangle {
  constructor() {
    this.type = 'triangle';
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
  }

  render() {
    var xy = this.position;
    var rgba = this.color;
    var s = this.size;

    // Pass the color of the point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Draw this triangle!
    var d = this.size/200.0
    // .866 = sqrt(3)/2 -> height of an equilateral triangle
    drawTriangle([xy[0]-(d*.5), xy[1]-(d*.433), xy[0]+(d*.5), xy[1]-(d*.433), xy[0], xy[1]+(d*.433)]);
  }
}

class VertexTriangle {
    constructor() {
    this.type = 'triangle';
    this.position = [0.0, 0.0, 0.0];
    this.vertices = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
  }

  render() {
    var xy = this.position;
    var rgba = this.color;
    var s = this.size;

    // Pass the color of the point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Draw this triangle!
    drawTriangle(this.vertices);
  }
}

class Circle {
  constructor() {
    this.type = 'circle';
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
    this.segments = g_selectedSegmentCount;
  }

  render() {
    var xy = this.position;
    var rgba = this.color;
    var s = this.size;

    // Pass the color of the point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Get the delta for size, divide by 400 instead of 200 so the diameter is consistent with the square & triangle sizes
    var d = s/400.0
    
    var angleStep = 360/this.segments;
    for (var angle = 0; angle < 360; angle += angleStep) {
      // Get the location of the mouse click; this will be the center point of the circle (aka point 0)
      var pt0 = [xy[0], xy[1]];
      // Get the current and next angles from which to draw a circle segment
      var angle1 = angle;
      var angle2 = angle + angleStep;
      // vec1 and vec2 represent the outer points of the triangle segment
      var vec1 = [Math.cos((angle1 * Math.PI) / 180) * d, Math.sin((angle1 * Math.PI) / 180) * d];
      var vec2 = [Math.cos((angle2 * Math.PI) / 180) * d, Math.sin((angle2 * Math.PI) / 180) * d];
      // Then we get the coordinates of these points in absolute space
      var pt1 = [pt0[0] + vec1[0], pt0[1] + vec1[1]];
      var pt2 = [pt0[0] + vec2[0], pt0[1] + vec2[1]];

      drawTriangle([pt0[0], pt0[1], pt1[0], pt1[1], pt2[0], pt2[1]]);
    }
  }
}

function drawTriangle(vertices) {
  var n = 3;

  // Create a buffer to pass the vertices of our triangle to
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Pass our buffer to the running WebGL context
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Put our vertices in the buffer
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  // Then give the same buffer a position...
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  // ...And signal the buffer that it will be receiving an attribute
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawPicture() {
  var triangles = [
    // SKY BACKGROUND
    [0, 0, 2, 0, 0, 11, 0.0, 1.0, 1.0],
    [2, 0, 0, 11, 2, 11, 0.0, 1.0, 1.0],
    [2, 0, 2, 2, 14, 0, 0.0, 1.0, 1.0],
    [2, 2, 14, 0, 14, 2, 0.0, 1.0, 1.0],
    [14, 0, 14, 11, 16, 0, 0.0, 1.0, 1.0],
    [16, 0, 14, 11, 16, 11, 0.0, 1.0, 1.0],

    // LAPTOP SCREEN FRAME
    [2, 2, 3, 2, 2, 11, 0.7, 0.7, 0.7],
    [3, 2, 2, 11, 3, 11, 0.7, 0.7, 0.7],
    [3, 2, 3, 3, 13, 2, 0.7, 0.7, 0.7],
    [3, 3, 13, 2, 13, 3, 0.7, 0.7, 0.7],
    [13, 2, 14, 2, 13, 11, 0.7, 0.7, 0.7],
    [14, 2, 13, 11, 14, 11, 0.7, 0.7, 0.7],
    [3, 10, 3, 11, 13, 10, 0.7, 0.7, 0.7],
    [3, 11, 13, 10, 13, 11, 0.7, 0.7, 0.7],

    // LAPTOP SCREEN
    [3, 3, 13, 3, 3, 10, 0.0, 0.0, 0.0],
    [13, 3, 3, 10, 13, 10, 0.0, 0.0, 0.0],

    // R
    [5, 4, 4, 5, 5, 6, 0.0, 1.0, 0.7],
    [5, 4, 6, 5, 5, 6, 0.0, 1.0, 0.7],
    [4, 5, 4, 7, 6, 7, 0.0, 1.0, 0.7],

    // L
    [7, 4, 8, 4, 8, 5, 0.9, 0.9, 1.0],
    [7, 4, 7, 6, 9, 6, 0.9, 0.9, 1.0],
    [8, 5, 9, 5, 9, 6, 0.9, 0.9, 1.0],

    // V
    [7, 7, 7, 8, 8, 8, 0.9, 0.9, 1.0],
    [9, 7, 8, 8, 9, 8, 0.9, 0.9, 1.0],
    [7, 8, 9, 8, 8, 9, 0.9, 0.9, 1.0],

    // M
    [10, 6, 10, 7, 11, 7, 1.0, 0.6, 0.9],
    [12, 6, 11, 7, 12, 7, 1.0, 0.6, 0.9],
    [10, 7, 12, 7, 10, 9, 1.0, 0.6, 0.9],
    [10, 7, 12, 7, 12, 9, 1.0, 0.6, 0.9],
    [10, 8, 12, 8, 11, 9, 1.0, 0.6, 0.9],

    // DESK BACKGROUND
    [0, 11, 2, 11, 0, 16, 0.5, 0.3, 0.0],
    [14, 11, 16, 11, 16, 16, 0.5, 0.3, 0.0],

    // LAPTOP KEYBOARD FRAME
    [2, 11, 0, 16, 2, 16, 0.8, 0.8, 0.8],
    [2, 11, 14, 11, 2, 12, 0.8, 0.8, 0.8],
    [14, 11, 2, 12, 14, 12, 0.8, 0.8, 0.8],
    [14, 11, 14, 16, 16, 16, 0.8, 0.8, 0.8],
    [2, 12, 3, 12, 2, 16, 0.8, 0.8, 0.8],
    [13, 12, 14, 12, 14, 16, 0.8, 0.8, 0.8],

    // LAPTOP KEYBOARD
    [3, 12, 2, 16, 3, 16, 0.6, 0.6, 0.6],
    [3, 12, 13, 12, 3, 16, 0.6, 0.6, 0.6],
    [13, 12, 3, 16, 13, 16, 0.6, 0.6, 0.6],
    [13, 12, 13, 16, 14, 16, 0.6, 0.6, 0.6]
  ]

  for (var i = 0; i < triangles.length; i++) {
    // Apply the color values of the current triangle
    gl.uniform4f(u_FragColor, triangles[i][6], triangles[i][7], triangles[i][8], 1.0);

    // Resize and reposition the coordinates for the canvas
    var x0 = (triangles[i][0] / 8.0) - 1;
    var y0 = (triangles[i][1] / -8.0) + 1;
    var x1 = (triangles[i][2] / 8.0) - 1;
    var y1 = (triangles[i][3] / -8.0) + 1;
    var x2 = (triangles[i][4] / 8.0) - 1;
    var y2 = (triangles[i][5] / -8.0) + 1;

    drawTriangle([x0, y0, x1, y1, x2, y2]);
  }

  // console.log("ran drawPicture");

  // gl.uniform4f(u_FragColor, 0.0, 1.0, 1.0, 1.0);
  // drawTriangle([
  //   (0 / 8.0) - 1, (0 / -8.0) + 1, 
  //   (2 / 8.0) - 1, (0 / -8.0) + 1, 
  //   (0 / 8.0) - 1, (11 / -8.0) + 1
  // ]);
}
