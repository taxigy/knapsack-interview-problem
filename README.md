# Knapsack interview problem

The [knapsack problem](https://en.wikipedia.org/wiki/Knapsack_problem) is a common problem you may encounter on a coding interview. As easy as it seems, it's not actually typical because it involves exponentially complex computation of all the possibilities.

There are two hacks:

- keep things sorted, and
- optimize the calculation of all combinations, because it's the one and only costly operation in the whole algorithm.

To make the solution clear, let's under-optimize a bit but make things look cleaner and understandable.

## Init

Let's say you are given a collection of elements, each defined by _weigth_ and _benefit_. Like an array of arrays:

```javascript
const collection = [[1, 1], [2, 1], [3, 2], [3, 5], [4, 2], [4, 5]];
```

here, the first element has weight of 1 and benefit of 1, the second has weight of 2 and benefit of 1, and so on.

You are also given with a _threshold:_ maximum weight your knapsack is able to carry. You simply can't pick things that add up to greater weight than defined as threshold.

The goals is now to declare such a function that takes collection and threshold and outputs the best combination possible.

## Calculate relative benefit

For every item, let's now calculate a _relative benefit_ and add it as the first item of every array that defines the item. Why? Because it's the easiest way to say that a certain element has better or worse benefit/weight ration than the other.

To make the calculation resistant to false positives (like items with equal benefit and weight):

```javascript
function calculateBenefit(item) {
  return [item[1] / item[0], ...item];
}
```

This function takes _one_ item. Since we have a collection of items, an array of arrays, we can use [`Array#map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map?v=control) to leverage it:

```javascript
collection.map(calculateBenefit);
// -> [[1, 1, 1], [0.5 , 2, 1], [0.6666666666666666, 3, 2], [1.6666666666666667, 3, 5], [0.5, 4, 2], [1.25, 4, 5]]
```

## Sort items by benefit

To make the further task simple, let's first sort items by calculated relative benefit. This way, we'll make sure that the most valuable items will always have preference over ones with lower value.

```javascript
function sortByBenefit(left, right) {
  return right[0] - left[0] || right[1] - left[1];
}
```

It's a sort function (see [`Array#sort`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort?v=control)), it takes two elements and compares them.

```javascript
collection.map(calculateBenefit).sort(sortByBenefit);
// -> [[1.6666666666666667, 3, 5], [1.25, 4, 5], [1, 1, 1], [0.6666666666666666, 3, 2], [0.5, 4, 2], [0.5, 2, 1]]
```

See that if the relative values of left and right items are the same, the weight is taken into account, and the element with greater weight wins. Why? Because we need to make sure that, even though we'll calculate all the possible combinations later, in rare cases the item with greater weight (and therefore greater value, given the ratio is the same) goes before the "lighter" item.

## Combinations

Now the most interesting part! We'd need to produce all the possible permutations, if the array wasn't previously sorted. But in fact, we don't need permutations, as it is enough to only have combinations of elements. It means that the optimal approach would be to always preserve head and only find combinations of tail recursively:

```javascript
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
```

Generic calculation of non-repetitive permutations of a collection takes `O(N!)` while getting all the combinations in this one only takes `O(N^2)`. You may easily check that doing

```javascript
sortedCombinations(collection).length === 2 ** collection.length;
```

it should be true for any collection.

For a collection of just 10 elements, it's around 0.3% of original time complexity. Not bad.

So, to check the result, do

```javascript
const combinations = sortedCombinations(collection.map(calculateBenefit).sort(sortByBenefit));
console.log(combinations); // will output lots of them!
```

## Total benefit per permutation

Time to calculate the total benefit and total weight of all the possible combination. This is the part that gives us the most important information: what combinations of items are suitable for our knapsack:

```javascript
function calculateTotalBenefit(item) {
  return [
    item.reduce((total, current) => total + current[0], 0), // benefit ratio
    item.reduce((total, current) => total + current[1], 0), // total weight
    ...item
  ];
}
```

See, we're adding more and more items to every item in our array. Now, every element in the resulting array looks like

```javascript
[totalBenefit, totalWeight, [benefitRatio, weight, benefit], [benefitRatio, weight, benefit], ...]
```

## Filter by weight against threshold

So, we're given the threshold. It's time to use it to filter only those element that have total weight less or equal to the threshold:

```javascript
function filterByWeight(threshold = Infinity) {
  return item => item[1] <= threshold;
}
```

This is a function that returns a [filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter?v=control) function. The idea is to keep things immutable and pure, so that none of the functions refer to values from outer scope or updates them.

## Sort again, now by total benefit

The easiest way to find an element with the greatest value in a collection is to run through this collection in `O(N)` time. The next great way is to sort this collection in `O(NlogN)` and pick the first element.

```javascript
function sortByTotalBenefit(left, right) {
  return right[0] - left[0];
}
```

## Final: fill the knapsack

So, the final function must use all the preceding steps and output the most valuable combination of items. Let's do this!

```javascript
function knapsack(items, maximumWeight) {
  const combinations = sortedCombinations(items.map(calculateBenefit).sort(sortByBenefit));
  const results = combinations.map(calculateTotalBenefit).filter(filterByWeight(maximumWeight)).sort(sortByTotalBenefit);
  const winner = results[0].slice(2).map(item => item.slice(1));

  return winner;
}
```

Now let's test it:

```javascript
knapsack(collection, 12);
// -> [[3, 5], [4, 5], [1, 1], [3, 2]]
knapsack(collection, 1);
// -> [[ 1, 1 ]]
knapsack(collection, 2);
// -> [[ 1, 1 ]]
knapsack(collection, 3);
// -> [[ 3, 5 ]]
```

Looks nice. What about infinitely big knapsack?

```javascript
knapsack(collection);
// -> [[1, 1], [2, 1], [3, 2], [3, 5], [4, 2], [4, 5]]
```

The solution doesn't really behave outside the edges, for example, when the knapsack size is less than zero. You can easily cover this case with an extra check in the `knapsack` function. It's actually a good thing to do, just like the ability to predict possible edge cases a nice ability to have.

## Try it

You can try it locally. To do this, open Node REPL:

```bash
$ git clone git@github.com:taxigy/knapsack-interview-problem.git && cd ./knapsack-interview-problem && node
```

then require the module with `knapsack` function and use it:

```javascript
const knapsack = require('./solution');
const collection = [[1, 1], [2, 1], [3, 2], [3, 5], [4, 2], [4, 5]];
console.log(knapsack(collection));
// see the solution output
```

---

Todo:

- [ ] `first(sort(seq))` is actually weird, just use `reduce` to output the most valuable element.
- [ ] more comments on input->output of functions, because it's easy to lose track of data structures (aka unmaintainable).
