/* global $, Box2D, jQuery, KeyboardJS, THREE */
const generateSquareMaze = require('./maze');

let camera;
let scene;
let renderer;
let light;
let maze;
let mazeMesh;
let mazeDimension = 11;
let planeMesh;
let ballMesh;
const ballRadius = 0.25;
let keyAxis = [0, 0];
const ironTexture = THREE.ImageUtils.loadTexture('static/img/ball.png');
const planeTexture = THREE.ImageUtils.loadTexture('static/img/concrete.png');
const brickTexture = THREE.ImageUtils.loadTexture('static/img/brick.png');
let gameState;

// Box2D shortcuts
const {
  b2World,
  b2FixtureDef,
  b2BodyDef,
  b2Body,
} = Box2D.Dynamics;
const {
  b2CircleShape,
  b2PolygonShape,
} = Box2D.Collision.Shapes;
const { b2Vec2 } = Box2D.Common.Math;

// Box2D world variables
let wWorld;
let wBall;


function createPhysicsWorld() {
  // Create the world object.
  // eslint-disable-next-line new-cap
  wWorld = new b2World(new b2Vec2(0, 0), true);

  // Create the ball.
  // eslint-disable-next-line new-cap
  const bodyDef = new b2BodyDef();
  bodyDef.type = b2Body.b2_dynamicBody;
  bodyDef.position.Set(1, 1);
  wBall = wWorld.CreateBody(bodyDef);
  // eslint-disable-next-line new-cap
  const fixDef = new b2FixtureDef();
  fixDef.density = 1.0;
  fixDef.friction = 0.0;
  fixDef.restitution = 0.25;
  // eslint-disable-next-line new-cap
  fixDef.shape = new b2CircleShape(ballRadius);
  wBall.CreateFixture(fixDef);

  // Create the maze.
  bodyDef.type = b2Body.b2_staticBody;
  // eslint-disable-next-line new-cap
  fixDef.shape = new b2PolygonShape();
  fixDef.shape.SetAsBox(0.5, 0.5);
  for (let i = 0; i < maze.dimension; i += 1) {
    for (let j = 0; j < maze.dimension; j += 1) {
      if (maze[i][j]) {
        bodyDef.position.x = i;
        bodyDef.position.y = j;
        wWorld.CreateBody(bodyDef).CreateFixture(fixDef);
      }
    }
  }
}


function generateMazeMesh(field) {
  const dummy = new THREE.Geometry();
  for (let i = 0; i < field.dimension; i += 1) {
    for (let j = 0; j < field.dimension; j += 1) {
      if (field[i][j]) {
        const geometry = new THREE.CubeGeometry(1, 1, 1, 1, 1, 1);
        const meshIj = new THREE.Mesh(geometry);
        meshIj.position.x = i;
        meshIj.position.y = j;
        meshIj.position.z = 0.5;
        THREE.GeometryUtils.merge(dummy, meshIj);
      }
    }
  }
  const material = new THREE.MeshPhongMaterial({
    map: brickTexture,
  });
  const mesh = new THREE.Mesh(dummy, material);
  return mesh;
}


function createRenderWorld() {
  // Create the scene object.
  scene = new THREE.Scene();

  // Add the light.
  light = new THREE.PointLight(0xffffff, 1);
  light.position.set(1, 1, 1.3);
  scene.add(light);

  // Add the ball.
  const ball = new THREE.SphereGeometry(ballRadius, 32, 16);
  const mesh = new THREE.MeshPhongMaterial({
    map: ironTexture,
  });
  ballMesh = new THREE.Mesh(ball, mesh);
  ballMesh.position.set(1, 1, ballRadius);
  scene.add(ballMesh);

  // Add the camera.
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(60, aspect, 1, 1000);
  camera.position.set(1, 1, 5);
  scene.add(camera);

  // Add the maze.
  mazeMesh = generateMazeMesh(maze);
  scene.add(mazeMesh);

  // Add the ground.
  const gMazeDim = mazeDimension * 10;
  const ground = new THREE.PlaneGeometry(gMazeDim, gMazeDim, mazeDimension, mazeDimension);
  planeTexture.wrapS = THREE.RepeatWrapping;
  planeTexture.wrapT = THREE.RepeatWrapping;
  planeTexture.repeat.set(mazeDimension * 5, mazeDimension * 5);
  const groundMesh = new THREE.MeshPhongMaterial({
    map: planeTexture,
  });
  planeMesh = new THREE.Mesh(ground, groundMesh);
  planeMesh.position.set((mazeDimension - 1) / 2, (mazeDimension - 1) / 2, 0);
  planeMesh.rotation.set(Math.PI / 2, 0, 0);
  scene.add(planeMesh);
}


function updatePhysicsWorld() {
  // Apply "friction".
  const lv = wBall.GetLinearVelocity();
  lv.Multiply(0.95);
  wBall.SetLinearVelocity(lv);

  // Apply user-directed force.
  // eslint-disable-next-line new-cap
  const f = new b2Vec2(keyAxis[0] * wBall.GetMass() * 0.25, keyAxis[1] * wBall.GetMass() * 0.25);
  wBall.ApplyImpulse(f, wBall.GetPosition());
  keyAxis = [0, 0];

  // Take a time step.
  wWorld.Step(1 / 60, 8, 3);
}


function updateRenderWorld() {
  // Update ball position.
  const stepX = wBall.GetPosition().x - ballMesh.position.x;
  const stepY = wBall.GetPosition().y - ballMesh.position.y;
  ballMesh.position.x += stepX;
  ballMesh.position.y += stepY;

  // Update ball rotation.
  let tempMat = new THREE.Matrix4();
  tempMat.makeRotationAxis(new THREE.Vector3(0, 1, 0), stepX / ballRadius);
  tempMat.multiplySelf(ballMesh.matrix);
  ballMesh.matrix = tempMat;
  tempMat = new THREE.Matrix4();
  tempMat.makeRotationAxis(new THREE.Vector3(1, 0, 0), -stepY / ballRadius);
  tempMat.multiplySelf(ballMesh.matrix);
  ballMesh.matrix = tempMat;
  ballMesh.rotation.getRotationFromMatrix(ballMesh.matrix);

  // Update camera and light positions.
  camera.position.x += (ballMesh.position.x - camera.position.x) * 0.1;
  camera.position.y += (ballMesh.position.y - camera.position.y) * 0.1;
  camera.position.z += (5 - camera.position.z) * 0.1;
  light.position.x = camera.position.x;
  light.position.y = camera.position.y;
  light.position.z = camera.position.z - 3.7;
}


function gameLoop() {
  // eslint-disable-next-line default-case
  switch (gameState) {
    case 'initialize': {
      maze = generateSquareMaze(mazeDimension);
      maze[mazeDimension - 1][mazeDimension - 2] = false;
      createPhysicsWorld();
      createRenderWorld();
      camera.position.set(1, 1, 5);
      light.position.set(1, 1, 1.3);
      light.intensity = 0;
      const level = Math.floor((mazeDimension - 1) / 2 - 4);
      $('#level').html(`Level ${level}`);
      gameState = 'fade in';
      break;
    }

    case 'fade in':
      light.intensity += 0.1 * (1.0 - light.intensity);
      renderer.render(scene, camera);
      if (Math.abs(light.intensity - 1.0) < 0.05) {
        light.intensity = 1.0;
        gameState = 'play';
      }
      break;

    case 'play': {
      updatePhysicsWorld();
      updateRenderWorld();
      renderer.render(scene, camera);

      // Check for victory.
      const mazeX = Math.floor(ballMesh.position.x + 0.5);
      const mazeY = Math.floor(ballMesh.position.y + 0.5);
      if (mazeX === mazeDimension && mazeY === mazeDimension - 2) {
        mazeDimension += 2;
        gameState = 'fade out';
      }
      break;
    }

    case 'fade out':
      updatePhysicsWorld();
      updateRenderWorld();
      light.intensity += 0.1 * (0.0 - light.intensity);
      renderer.render(scene, camera);
      if (Math.abs(light.intensity - 0.0) < 0.1) {
        light.intensity = 0.0;
        renderer.render(scene, camera);
        gameState = 'initialize';
      }
      break;
  }
  requestAnimationFrame(gameLoop);
}


function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}


function onMoveKey(axis) {
  keyAxis = axis.slice(0);
}

jQuery.fn.centerv = function () {
  const wh = window.innerHeight;
  const h = this.outerHeight();
  this.css('position', 'absolute');
  this.css('top', `${Math.max(0, (wh - h) / 2)}px`);
  return this;
};


jQuery.fn.centerh = function () {
  const ww = window.innerWidth;
  const w = this.outerWidth();
  this.css('position', 'absolute');
  this.css('left', `${Math.max(0, (ww - w) / 2)}px`);
  return this;
};


jQuery.fn.center = function () {
  this.centerv();
  this.centerh();
  return this;
};


$(document).ready(() => {
  // Prepare the instructions.
  $('#instructions').center();
  $('#instructions').hide();
  KeyboardJS.bind.key('i', () => {
    $('#instructions').show();
  },
  () => {
    $('#instructions').hide();
  });

  // Create the renderer.
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Bind keyboard and resize events.
  KeyboardJS.bind.axis('left', 'right', 'down', 'up', onMoveKey);
  KeyboardJS.bind.axis('h', 'l', 'j', 'k', onMoveKey);
  $(window).resize(onResize);


  // Set the initial game state.
  gameState = 'initialize';

  // Start the game loop.
  requestAnimationFrame(gameLoop);
});
