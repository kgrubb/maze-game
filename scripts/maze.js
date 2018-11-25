function generateSquareMaze(dimension) {
  function iterate(field, x, y) {
    // eslint-disable-next-line no-param-reassign
    field[x][y] = false;
    while (true) {
      const directions = [];
      if (x > 1 && field[x - 2][y] === true) {
        directions.push([-1, 0]);
      }
      if (x < field.dimension - 2 && field[x + 2][y] === true) {
        directions.push([1, 0]);
      }
      if (y > 1 && field[x][y - 2] === true) {
        directions.push([0, -1]);
      }
      if (y < field.dimension - 2 && field[x][y + 2] === true) {
        directions.push([0, 1]);
      }
      if (directions.length === 0) {
        return field;
      }
      const dir = directions[Math.floor(Math.random() * directions.length)];
      // eslint-disable-next-line no-param-reassign
      field[x + dir[0]][y + dir[1]] = false;
      // eslint-disable-next-line no-param-reassign
      field = iterate(field, x + dir[0] * 2, y + dir[1] * 2);
    }
  }
  // Initialize the field.
  let field = new Array(dimension);
  field.dimension = dimension;
  for (let i = 0; i < dimension; i += 1) {
    field[i] = new Array(dimension);
    for (let j = 0; j < dimension; j += 1) {
      field[i][j] = true;
    }
  }
  // Gnerate the maze recursively.
  field = iterate(field, 1, 1);
  return field;
}

module.exports = generateSquareMaze;
