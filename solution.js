function calculateBenefit(item) {
  return [item[1] / item[0], ...item];
}

function sortByBenefit(left, right) {
  return right[0] - left[0] || right[1] - left[1];
}

function sortedCombinations(items) {
  let result = [];

  const permute = (left = [], right = items) => {
    if (right.length === 0) {
      result.push(left);

      return;
    }

    const include = [...left, right[0]];
    const exclude = left;

    permute(include, right.slice(1));
    permute(exclude, right.slice(1));
  }

  permute([], items);

  return result;
}

function calculateTotalBenefit(item) {
  return [
    item.reduce((total, current) => total + current[0], 0), // benefit ratio
    item.reduce((total, current) => total + current[1], 0), // total weight
    ...item
  ];
}

function filterByWeight(threshold = Infinity) {
  return item => item[1] <= threshold;
}

function sortByTotalBenefit(left, right) {
  return right[0] - left[0]; // same as sortByBenefit, repeated here for the purpose of story
}

function knapsack(items, maximumWeight) {
  const combinations = sortedCombinations(items.map(calculateBenefit).sort(sortByBenefit));
  const results = combinations.map(calculateTotalBenefit).filter(filterByWeight(maximumWeight)).sort(sortByTotalBenefit);
  const winner = results[0].slice(2).map(item => item.slice(1));

  return winner;
}

// In shell, do
// $ node
// > const knapsack = require('./solution');
// > const collection = [[1, 1], [2, 1], [3, 2], [3, 5], [4, 2], [4, 5]];
// > console.log(knapsack(collection));
module.exports = knapsack;
