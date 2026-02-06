// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
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
var u_Size;
var u_ModelMatrix;
var u_GlobalRotateMatrix;

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
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
  
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  var IdentityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, IdentityM.elements);
}

var g_selectedColor = [1.0, 1.0, 1.0, 1.0];
var g_selectedSize = 5;
var g_selectedType = 'square';
var g_selectedSegmentCount = 12;
var g_globalAngleX = 0;
var g_globalAngleY = 0;
var g_animationToggle = true;

var g_wingAngle = 0;
var g_bodyAngle = 0;
var g_headAngle = 0;
var g_uTailAngle = 0;
var g_mTailAngle = 0;
var g_lTailAngle = 0;

var g_startTime = performance.now()/1000.0;
var g_lastFrame = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;

function addActionsForHtmlUI() {
  // Button Events
  document.getElementById('animationOnButton').addEventListener("mouseup", function() {
    g_animationToggle = true;
  });
  document.getElementById('animationOffButton').addEventListener("mouseup", function() {
    g_animationToggle = false;
  });

  // Slide Events
  document.getElementById('angleSlide').addEventListener("mousemove", function() { 
    g_globalAngleX = this.value;
  });
  document.getElementById('headSlide').addEventListener("mousemove", function() { 
    g_headAngle = (this.value + 20) / 20;
  });
  document.getElementById('bodySlide').addEventListener("mousemove", function() { 
    g_bodyAngle = (this.value * -1) - 20;
  });
  document.getElementById('wingSlide').addEventListener("mousemove", function() { 
    g_wingAngle = this.value * -1;
  });
  document.getElementById('uTailSlide').addEventListener("mousemove", function() { 
    g_uTailAngle = this.value * -1;
  });
  document.getElementById('mTailSlide').addEventListener("mousemove", function() { 
    g_mTailAngle = this.value * -1;
  });
  document.getElementById('lTailSlide').addEventListener("mousemove", function() { 
    g_lTailAngle = this.value * -1;
  });
}

function main() {
  // Get the canvas from the HTML document and the WebGL context
  setupWebGL();

  // Get the a_Position and u_FragColor attributes from the WebGL context and initialize GLSL shaders
  connectVariablesToGLSL();

  // Connect the HTML buttons to JS functions
  addActionsForHtmlUI();

  // Canvas Events
  canvas.onmousemove = function(ev) {
    if (ev.buttons == 1) 
      click(ev);
  };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  requestAnimationFrame(tick);
}

function tick() {
  g_seconds = performance.now()/1000.0-g_startTime;
  if (g_animationToggle) calculateAnimations();
  renderAllShapes();
  var fpsReader = document.getElementById('fpsReader');
  var duration = performance.now() - g_startTime;
  var text = document.createTextNode("fps: " + Math.floor(1000/(duration - g_lastFrame)) + " ms: " + Math.floor(duration));
  g_lastFrame = duration;
  fpsReader.replaceChildren(text);
  requestAnimationFrame(tick);
}

function click(ev) {
  // Extract the x, y coordinates where we want to put our shape from the click event
  var [x, y] = convertCoordinatesEventToGL(ev);
  g_globalAngleX = x * -180;
  g_globalAngleY = y * 180;
}

function calculateAnimations() {
  g_bodyAngle = (10 * Math.sin(g_seconds)) - 30;
  g_headAngle = (-10 * Math.sin(g_seconds)) + 30;
  g_wingAngle = ((5 * Math.sin(g_seconds)) - 5);
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
  var globalRotMat = new Matrix4();
  globalRotMat.rotate(g_globalAngleX, 0, 1, 0);
  globalRotMat.rotate(g_globalAngleY, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT);

  var body = new Cube();
  body.color = [0.4, 0.6, 1.0, 1.0];
  body.matrix.translate(-0.25, -0.4, -0.05);
  body.matrix.rotate(g_bodyAngle, 1, 0, 0);
  // body.matrix.rotate((g_bodyAngle * -1) - 20, 1, 0, 0);
  // body.matrix.rotate((10*Math.sin(g_seconds)) - 30, 1, 0, 0)
  var coords_Body = new Matrix4(body.matrix);
  body.matrix.scale(0.5, 0.9, 0.5);
  body.render();

  var head = new Cube();
  head.color = [0.9, 0.9, 0.9, 1.0];
  head.matrix = new Matrix4(coords_Body);
  head.matrix.translate(0.05, 0.9, -0.05);
  head.matrix.rotate(g_headAngle, 1, 0, 0)
  // head.matrix.rotate((-10*Math.sin(g_seconds)) + 30, 1, 0, 0);
  var coords_head = new Matrix4(head.matrix);
  head.matrix.scale(0.4, 0.4, 0.4);
  head.render();

  var beak = new Cube();
  beak.color = [0.9, 0.7, 0.0, 1.0];
  beak.matrix = new Matrix4(coords_head);
  beak.matrix.translate(0.15, 0.075, -0.1);
  beak.matrix.scale(0.1, 0.1, 0.1);
  beak.render();

  var cere = new Cube();
  cere.color = [0.9, 0.7, 0.7, 1.0];
  cere.matrix = new Matrix4(coords_head);
  cere.matrix.translate(0.15, 0.175, -0.05);
  cere.matrix.scale(0.1, 0.05, 0.05);
  cere.render();

  var leftWing_Inner = new Cube();
  leftWing_Inner.color = [0.2, 0.2, 0.2, 1.0];
  leftWing_Inner.matrix = new Matrix4(coords_Body);
  leftWing_Inner.matrix.translate(0.5, 0.75, 0.45);
  leftWing_Inner.matrix.rotate(180, 1, 0, 0);
  leftWing_Inner.matrix.rotate(g_wingAngle, 0, 0, 1);
  // leftWing_Inner.matrix.rotate((5 * Math.sin(g_seconds)) - 5, 0, 0, 1);
  // leftWing_Inner.matrix.rotate(g_wingAngle * -1, 0, 0, 1);
  coords_LW = new Matrix4(leftWing_Inner.matrix);
  leftWing_Inner.matrix.scale(0.05, 0.7, 0.4);
  leftWing_Inner.render();

  var leftWing_Outer = new Cube();
  leftWing_Outer.color = [0.9, 0.9, 0.9, 1.0];
  leftWing_Outer.matrix = new Matrix4(coords_LW);
  leftWing_Outer.matrix.translate(0.051, 0.35, 0);
  leftWing_Outer.matrix.scale(0.05, 0.5, 0.3);
  leftWing_Outer.render();

  var rightWing_Inner = new Cube();
  rightWing_Inner.color = [0.2, 0.2, 0.2, 1.0];
  rightWing_Inner.matrix = new Matrix4(coords_Body);
  rightWing_Inner.matrix.translate(0, 0.75, 0.05);
  rightWing_Inner.matrix.rotate(180, 1, 0, 0);
  rightWing_Inner.matrix.rotate(180, 0, 1, 0)
  rightWing_Inner.matrix.rotate(g_wingAngle, 0, 0, 1);
  // rightWing_Inner.matrix.rotate((5 * Math.sin(g_seconds)) - 5, 0, 0, 1);
  // rightWing_Inner.matrix.rotate(g_wingAngle * -1, 0, 0, 1);
  coords_RW = new Matrix4(rightWing_Inner.matrix);
  rightWing_Inner.matrix.scale(0.05, 0.7, 0.4);
  rightWing_Inner.render();

  var rightWing_Outer = new Cube();
  rightWing_Outer.color = [0.9, 0.9, 0.9, 1.0];
  rightWing_Outer.matrix = new Matrix4(coords_RW);
  rightWing_Outer.matrix.translate(0.051, 0.35, 0.1);
  rightWing_Outer.matrix.scale(0.05, 0.5, 0.3);
  rightWing_Outer.render();

  var tail_Upper = new Cube();
  tail_Upper.color = [0.3, 0.5, 1.0, 1.0];
  tail_Upper.matrix = new Matrix4(coords_Body);
  tail_Upper.matrix.translate(0.05, 0.4, 0.55);
  tail_Upper.matrix.rotate(180, 1, 0, 0)
  tail_Upper.matrix.rotate(g_uTailAngle, 1, 0, 0);
  var coords_TU = new Matrix4(tail_Upper.matrix);
  tail_Upper.matrix.scale(0.4, 0.7, 0.05);
  tail_Upper.render();

  var tail_Middle = new Cube();
  tail_Middle.color = [0.2, 0.3, 0.6, 1.0];
  tail_Middle.matrix = new Matrix4(coords_TU);
  tail_Middle.matrix.translate(0.05, 0.2, -0.05);
  tail_Middle.matrix.rotate(g_mTailAngle, 1, 0, 0);
  var coords_TM = new Matrix4(tail_Middle.matrix);
  tail_Middle.matrix.scale(0.3, 0.7, 0.05);
  tail_Middle.render();

  var tail_Lower = new Cube();
  tail_Lower.color = [0.2, 0.2, 0.2, 1.0];
  tail_Lower.matrix = new Matrix4(coords_TM);
  tail_Lower.matrix.translate(0.05, 0.4, -0.05);
  tail_Lower.matrix.rotate(g_lTailAngle, 1, 0, 0);
  tail_Lower.matrix.scale(0.2, 0.5, 0.05);
  tail_Lower.render();

  var rightLeg_Ankle = new Cube();
  rightLeg_Ankle.color = [0.9, 0.7, 0.7, 1.0];
  rightLeg_Ankle.matrix.translate(-0.2, -0.7, -0.15);
  rightLeg_Ankle.matrix.rotate(20, 1, 0, 0);
  rightLeg_Ankle.matrix.scale(0.05, 0.4, 0.05);
  rightLeg_Ankle.render();

  var rightLeg_leftTalon = new Cube();
  rightLeg_leftTalon.color = [0.9, 0.7, 0.7, 1.0];
  rightLeg_leftTalon.matrix.translate(-0.2, -0.75, -0.1);
  rightLeg_leftTalon.matrix.rotate(70, 0, 1, 0);
  rightLeg_leftTalon.matrix.scale(0.3, 0.05, 0.05);
  rightLeg_leftTalon.render();

  var rightLeg_FrontTalon = new Cube();
  rightLeg_FrontTalon.color = [0.9, 0.7, 0.7, 1.0];
  rightLeg_FrontTalon.matrix.translate(-0.2, -0.75, -0.1);
  rightLeg_FrontTalon.matrix.rotate(90, 0, 1, 0);
  rightLeg_FrontTalon.matrix.scale(0.3, 0.05, 0.05);
  rightLeg_FrontTalon.render();

  var rightLeg_RightTalon = new Cube();
  rightLeg_RightTalon.color = [0.9, 0.7, 0.7, 1.0];
  rightLeg_RightTalon.matrix.translate(-0.2, -0.75, -0.1);
  rightLeg_RightTalon.matrix.rotate(110, 0, 1, 0);
  rightLeg_RightTalon.matrix.scale(0.3, 0.05, 0.05);
  rightLeg_RightTalon.render();

  var rightLeg_BackTalon = new Cube();
  rightLeg_BackTalon.color = [0.9, 0.7, 0.7, 1.0];
  rightLeg_BackTalon.matrix.translate(-0.15, -0.75, -0.1);
  rightLeg_BackTalon.matrix.rotate(270, 0, 1, 0);
  rightLeg_BackTalon.matrix.scale(0.3, 0.05, 0.05);
  rightLeg_BackTalon.render();

  var leftLeg_Ankle = new Cube();
  leftLeg_Ankle.color = [0.9, 0.7, 0.7, 1.0];
  leftLeg_Ankle.matrix.translate(0.15, -0.7, -0.15);
  leftLeg_Ankle.matrix.rotate(20, 1, 0, 0);
  leftLeg_Ankle.matrix.scale(0.05, 0.4, 0.05);
  leftLeg_Ankle.render();

  var leftLeg_leftTalon = new Cube();
  leftLeg_leftTalon.color = [0.9, 0.7, 0.7, 1.0];
  leftLeg_leftTalon.matrix.translate(0.15, -0.75, -0.1);
  leftLeg_leftTalon.matrix.rotate(70, 0, 1, 0);
  leftLeg_leftTalon.matrix.scale(0.3, 0.05, 0.05);
  leftLeg_leftTalon.render();

  var leftLeg_FrontTalon = new Cube();
  leftLeg_FrontTalon.color = [0.9, 0.7, 0.7, 1.0];
  leftLeg_FrontTalon.matrix.translate(0.15, -0.75, -0.1);
  leftLeg_FrontTalon.matrix.rotate(90, 0, 1, 0);
  leftLeg_FrontTalon.matrix.scale(0.3, 0.05, 0.05);
  leftLeg_FrontTalon.render();

  var leftLeg_RightTalon = new Cube();
  leftLeg_RightTalon.color = [0.9, 0.7, 0.7, 1.0];
  leftLeg_RightTalon.matrix.translate(0.15, -0.75, -0.1);
  leftLeg_RightTalon.matrix.rotate(110, 0, 1, 0);
  leftLeg_RightTalon.matrix.scale(0.3, 0.05, 0.05);
  leftLeg_RightTalon.render();

  var leftLeg_BackTalon = new Cube();
  leftLeg_BackTalon.color = [0.9, 0.7, 0.7, 1.0];
  leftLeg_BackTalon.matrix.translate(0.2, -0.75, -0.1);
  leftLeg_BackTalon.matrix.rotate(270, 0, 1, 0);
  leftLeg_BackTalon.matrix.scale(0.3, 0.05, 0.05);
  leftLeg_BackTalon.render();


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

class Cube {
  constructor() {
    this.type = 'cube';
    // this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    // this.size = 5.0;
    // this.segments = g_selectedSegmentCount;
    this.matrix = new Matrix4();
  }

  render() {
    var rgba = this.color;

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    
    // Front of cube

    // Color
    gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);
    // Shape
    drawTriangle3D([
      0.0, 0.0, 0.0, 
      1.0, 1.0, 0.0, 
      1.0, 0.0, 0.0
    ])
    drawTriangle3D([
      0.0, 0.0, 0.0, 
      0.0, 1.0, 0.0, 
      1.0, 1.0, 0.0
    ])

    // Back of cube

    // Color
    gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
    // Shape
    drawTriangle3D([
      0.0, 0.0, 1.0, 
      1.0, 1.0, 1.0, 
      1.0, 0.0, 1.0
    ])
    drawTriangle3D([
      0.0, 0.0, 1.0, 
      0.0, 1.0, 1.0, 
      1.0, 1.0, 1.0
    ])

    // Top of cube

    // Color
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    // Shape
    drawTriangle3D([
      0.0, 1.0, 0.0, 
      0.0, 1.0, 1.0, 
      1.0, 1.0, 1.0
    ])
    drawTriangle3D([
      0.0, 1.0, 0.0, 
      1.0, 1.0, 1.0, 
      1.0, 1.0, 0.0
    ])

    // Bottom of cube

    // Color
    gl.uniform4f(u_FragColor, rgba[0]*0.6, rgba[1]*0.6, rgba[2]*0.6, rgba[3]);
    // Shape
    drawTriangle3D([
      0.0, 0.0, 0.0, 
      0.0, 0.0, 1.0, 
      1.0, 0.0, 1.0
    ])
    drawTriangle3D([
      0.0, 0.0, 0.0, 
      1.0, 0.0, 1.0, 
      1.0, 0.0, 0.0
    ])

    // Left of cube

    // Color
    gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
    // Shape
    drawTriangle3D([
      0.0, 0.0, 0.0, 
      0.0, 1.0, 1.0, 
      0.0, 1.0, 0.0
    ])
    drawTriangle3D([
      0.0, 0.0, 0.0, 
      0.0, 0.0, 1.0, 
      0.0, 1.0, 1.0
    ])

    // Right of cube

    // Color
    gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
    // Shape
    drawTriangle3D([
      1.0, 0.0, 0.0, 
      1.0, 1.0, 1.0, 
      1.0, 1.0, 0.0
    ])
    drawTriangle3D([
      1.0, 0.0, 0.0, 
      1.0, 0.0, 1.0, 
      1.0, 1.0, 1.0
    ])
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

function drawTriangle3D(vertices) {
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
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  // ...And signal the buffer that it will be receiving an attribute
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}
