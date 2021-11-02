var Genetic = require("../lib/genetic");
var assert = require("assert");

function isEqual(a, b) {
  // if length is not equal
  if (a.length != b.length)
    return false;
  else {
    // comapring each element of array
    for (let i = 0; i < a.length; i++)
      if (a[i] != b[i])
        return false;
    return true;
  }
}

const mustHaveConstraint = (constraintParam) => ({
  name: 'mustHave',
  constraintMethod: 'fix',
  constraintParams: constraintParam,
  exec(pop, constraintArray) {
    const mustHavePop = [];
    for (let i = 0; i < pop.length; i++) {
      mustHavePop.push(pop[i] | constraintArray[i]);
    }
    return mustHavePop;
  }
});

const mustExludeConstraint = (constraintParam) => ({
  name: 'mustExlude',
  constraintMethod: 'fix',
  constraintParams: constraintParam,
  exec(pop, constraintArray) {
    const mustHavePop = [];
    for (let i = 0; i < pop.length; i++) {
      mustHavePop.push(pop[i] & constraintArray[i]);
    }
    return mustHavePop;
  }
});


var genetic;

beforeEach('Setting Up Genetic', function () {
  genetic = Genetic.create();
  genetic.optimize = Genetic.Optimize.Maximize;
  genetic.select1 = Genetic.Select1.RandomLinearRank;
  genetic.select2 = Genetic.Select2.Tournament2
});

describe("Constraints", function () {
  it("Must Have One : Position 1", function () {
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
    genetic.generation = function (pop, generation, stats, isFinished) {
      if (generation > 1) {
        for (let i = 0; i < pop.length; i++) {
          const singleGeneration = pop[i].entity;

          // console.log(`entity ${i}`, pop[i].entity);
          // console.log('generation', generation);

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
});
