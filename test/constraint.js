var Genetic = require("../lib/genetic");
const {
  mustHaveConstraint,
  mustExludeConstraint,
  ifPickedKeepGroup,
  ifPickedKeepGroupAlternative,
  ifPickedOnlyIncludeOne,
} = require('./utils');
var assert = require("assert");

var genetic;

beforeEach('Setting Up Genetic', function () {
  genetic = Genetic.create();
  genetic.optimize = Genetic.Optimize.Maximize;
  genetic.select1 = Genetic.Select1.RandomLinearRank;
  genetic.select2 = Genetic.Select2.Tournament2;

  genetic.seed = function () {
    return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  };
  genetic.mutate = function (entity) {
    const i = Math.floor(Math.random() * entity.length);
    const flipValue = (1 - entity[i]);
    entity.splice(i, 1, flipValue);

    return entity;
  };
  genetic.crossover = function (mother, father) {
    // two-point crossover
    const len = mother.length;
    let ca = Math.floor(Math.random() * len);
    let cb = Math.floor(Math.random() * len);
    if (ca > cb) {
      const tmp = cb;
      cb = ca;
      ca = tmp;
    }

    const fatherBegin = father.slice(0, ca);
    const fatherMid = father.slice(ca, cb);
    const fatherEnd = father.slice(cb);

    const motherBegin = mother.slice(0, ca);
    const motherMid = mother.slice(ca, cb);
    const motherEnd = mother.slice(cb);

    const son = [
      ...fatherBegin,
      ...motherMid,
      ...fatherEnd
    ];

    const daughter = [
      ...motherBegin,
      ...fatherMid,
      ...motherEnd
    ];

    return [son, daughter];
  };
  genetic.fitness = function (entity) {
    return entity.reduce((acc, single) => {
      acc += single;
      return acc;
    }, 0)
  };
});

describe("Constraints", function () {
  it("Must Have One : Position 1", function () {
    genetic.generation = function (pop, generation, stats, isFinished) {
      if (generation > 1) {
        for (let i = 0; i < pop.length; i++) {
          const singleGeneration = pop[i].entity;

          assert.equal(singleGeneration[1], 1);
        }

      }
    }

    const config = {
      iterations: 1000,
      size: 100,
      crossover: 0.7,
      mutation: 0.7,
    };

    const constraints = {
      mustHave: mustHaveConstraint([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    }

    genetic.evolve(config, {}, constraints);
  });

  it("Must Have One : Multiple : Position 0, 1, 3", function () {
    genetic.generation = function (pop, generation, stats, isFinished) {
      if (generation > 1) {
        for (let i = 0; i < pop.length; i++) {
          const singleGeneration = pop[i].entity;

          assert.equal(singleGeneration[0], 1);
          assert.equal(singleGeneration[1], 1);
          assert.equal(singleGeneration[3], 1);
        }

      }
    }

    const config = {
      iterations: 20,
      size: 20,
      crossover: 0.3,
      mutation: 0.3,
    };

    const constraints = {
      mustHave: mustHaveConstraint([1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    }

    genetic.evolve(config, {}, constraints);
  });

  it("Must Have Multiple Constraints", function () {
    genetic.generation = function (pop, generation, stats, isFinished) {
      if (generation > 1) {
        for (let i = 0; i < pop.length; i++) {
          const singleGeneration = pop[i].entity;

          assert.equal(singleGeneration[0], 1);
          assert.equal(singleGeneration[1], 1);
          assert.equal(singleGeneration[2], 1);
          assert.equal(singleGeneration[3], 1);
        }

      }
    }

    const config = {
      iterations: 100,
      size: 100,
      crossover: 0.7,
      mutation: 0.7,
    };

    const constraints = {
      mustHaveFirst: mustHaveConstraint([1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      mustHaveSecond: mustHaveConstraint([0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    }

    genetic.evolve(config, {}, constraints);
  });

  it("Must-have and Must-exclude Constraints", function () {
    genetic.generation = function (pop, generation, stats, isFinished) {
      if (generation > 1) {
        for (let i = 0; i < pop.length; i++) {
          const singleGeneration = pop[i].entity;

          assert.equal(singleGeneration[0], 1);
          assert.equal(singleGeneration[1], 1);
          assert.equal(singleGeneration[2], 1);

          assert.equal(singleGeneration[3], 0);
          assert.equal(singleGeneration[4], 0);
          assert.equal(singleGeneration[5], 0);
        }
      }
    }

    const config = {
      iterations: 100,
      size: 100,
      crossover: 0.7,
      mutation: 0.7,
    };

    const constraints = {
      mustHave: mustHaveConstraint([1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      mustExclude: mustExludeConstraint([1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1])
    }

    genetic.evolve(config, {}, constraints);
  });

  it("Conflicting Constraints - Last Must Exclude", function () {
    genetic.generation = function (pop, generation, stats, isFinished) {
      if (generation > 1) {
        for (let i = 0; i < pop.length; i++) {
          const singleGeneration = pop[i].entity;

          for (let i = 0; i < singleGeneration.length; i++) {
            assert.equal(singleGeneration[i], 0);
          }
        }
      }
    }

    const config = {
      iterations: 100,
      size: 100,
      crossover: 0.7,
      mutation: 0.7,
    };

    const constraints = {
      mustHave: mustHaveConstraint([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      mustExclude: mustExludeConstraint([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    }

    genetic.evolve(config, {}, constraints);
  });

  it("If Picked, then keep group", function () {
    const keepIndexes = [0, 1, 2];

    genetic.generation = function (pop, generation, stats, isFinished) {
      if (generation > 1) {
        for (let i = 0; i < pop.length; i++) {
          const singleGeneration = pop[i].entity;

          for (const index of keepIndexes) {
            if (singleGeneration[index]) {
              assert.equal(singleGeneration[0], 1);
              assert.equal(singleGeneration[1], 1);
              assert.equal(singleGeneration[2], 1);
              break;
            } else {
              assert.equal(singleGeneration[0], 0);
              assert.equal(singleGeneration[1], 0);
              assert.equal(singleGeneration[2], 0);
            }
          }
        }
      }
    }

    const config = {
      iterations: 100,
      size: 100,
      crossover: 0.7,
      mutation: 0.7,
    };

    const constraints = {
      ifPickedKeepGroup: ifPickedKeepGroup([keepIndexes, [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]])
    }

    genetic.evolve(config, {}, constraints);
  });

  it("If Picked, then keep group alternative", function () {
    const keepIndexes = [3, 4, 5, 6];

    genetic.generation = function (pop, generation, stats, isFinished) {
      if (generation > 1) {
        for (let i = 0; i < pop.length; i++) {
          const singleGeneration = pop[i].entity;

          const isGrouped = keepIndexes.some(index => singleGeneration[index] === 1);

          if (isGrouped) {
            assert.equal(singleGeneration[3], 1);
            assert.equal(singleGeneration[4], 1);
            assert.equal(singleGeneration[5], 1);
            assert.equal(singleGeneration[6], 1);
          } else {
            assert.equal(singleGeneration[3], 0);
            assert.equal(singleGeneration[4], 0);
            assert.equal(singleGeneration[5], 0);
            assert.equal(singleGeneration[6], 0);
          }
        }
      }
    }

    const config = {
      iterations: 100,
      size: 100,
      crossover: 0.7,
      mutation: 0.7,
    };

    const constraints = {
      ifPickedKeepGroup: ifPickedKeepGroupAlternative(keepIndexes)
    }

    genetic.evolve(config, {}, constraints);
  });

  it("If Picked, then keep only One of Group", function () {
    const keepIndexes = [1, 3, 4, 8];

    genetic.generation = function (pop, generation, stats, isFinished) {
      if (generation > 2) {
        for (let i = 0; i < pop.length; i++) {
          const singleGeneration = pop[i].entity;
          const isKept = keepIndexes.findIndex(possiblySelected => singleGeneration[possiblySelected] === 1);

          if (isKept !== -1) {
            for (const possiblyKept of keepIndexes) {
              if (possiblyKept === keepIndexes[isKept]) {
                assert.equal(singleGeneration[possiblyKept], 1);
              } else {
                assert.equal(singleGeneration[possiblyKept], 0);
              }
            }
          } else {
            for (const didNotKeep of keepIndexes) {
              assert.equal(singleGeneration[didNotKeep], 0);
            }
          }
        }
      }
    }

    const config = {
      iterations: 100,
      size: 100,
      crossover: 0.7,
      mutation: 0.7,
    };

    const constraints = {
      ifPickedOnlyIncludeOne: ifPickedOnlyIncludeOne(keepIndexes)
    }

    genetic.evolve(config, {}, constraints);
  });
});
