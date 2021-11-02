(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

window.Genetic = require('./genetic');

},{"./genetic":2}],2:[function(require,module,exports){

var Genetic = Genetic || (function () {

  'use strict';

  // facilitates communcation between web workers
  const Serialization = {
    stringify: function (obj) {
      return JSON.stringify(obj, function (key, value) {
        if (value instanceof Function || typeof value == 'function') return '__func__:' + value.toString();
        if (value instanceof RegExp) return '__regex__:' + value;
        return value;
      });
    },
    parse: function (str) {
      return JSON.parse(str, function (key, value) {
        if (typeof value != 'string') return value;
        if (value.lastIndexOf('__func__:', 0) === 0) return eval('(' + value.slice(9) + ')');
        if (value.lastIndexOf('__regex__:', 0) === 0) return eval('(' + value.slice(10) + ')');
        return value;
      });
    }
  };

  const Clone = (item) => {
    if (!item) { return item; } // null, undefined values check

    const types = [Number, String, Boolean];
    let result;

    // normalizing primitives if someone did new String('aaa'), or new Number('444');
    types.forEach(function (type) {
      if (item instanceof type) {
        result = type(item);
      }
    });

    if (typeof result == 'undefined') {
      if (Object.prototype.toString.call(item) === '[object Array]') {
        result = [];
        item.forEach(function (child, index, array) {
          result[index] = Clone(child);
        });
      } else if (typeof item == 'object') {
        // testing that this is DOM
        if (item.nodeType && typeof item.cloneNode == 'function') {
          result = item.cloneNode(true);
        } else if (!item.prototype) { // check that this is a literal
          if (item instanceof Date) {
            result = new Date(item);
          } else {
            // it is an object literal
            result = {};
            for (var i in item) {
              result[i] = Clone(item[i]);
            }
          }
        } else {
          // depending what you would like here,
          // just keep the reference, or create new object
          if (false && item.constructor) {
            // would not advice to do that, reason? Read below
            result = new item.constructor();
          } else {
            result = item;
          }
        }
      } else {
        result = item;
      }
    }

    return result;
  }

  const runConstraint = (entities, constraint) => {
    const constrainedEntities = [];

    for (const constraintName in constraint) {
      if (Object.hasOwnProperty.call(constraint, constraintName)) {
        const { exec, constraintParam } = constraint[constraintName];

        for (const singleEntity of entities) {
          constrainedEntities.push(exec(singleEntity, constraintParam));
        }
      }
    }

    return constrainedEntities;
  }

  const runConstraintChild = (entity, constraint) => {
    let mutableEntity = entity;

    for (const constraintName in constraint) {
      if (Object.hasOwnProperty.call(constraint, constraintName)) {
        const { exec, constraintParam } = constraint[constraintName];

        mutableEntity = exec(mutableEntity, constraintParam);
      }
    }

    return mutableEntity;
  }

  const Optimize = {
    Maximize: function (a, b) { return a >= b; },
    Minimize: function (a, b) { return a < b; }
  };

  const Select1 = {
    Tournament2: function (pop) {
      const n = pop.length;
      const a = pop[Math.floor(Math.random() * n)];
      const b = pop[Math.floor(Math.random() * n)];
      return this.optimize(a.fitness, b.fitness) ? a.entity : b.entity;
    },
    Tournament3: function (pop) {
      const n = pop.length;
      const a = pop[Math.floor(Math.random() * n)];
      const b = pop[Math.floor(Math.random() * n)];
      const c = pop[Math.floor(Math.random() * n)];
      let best = this.optimize(a.fitness, b.fitness) ? a : b;
      best = this.optimize(best.fitness, c.fitness) ? best : c;
      return best.entity;
    },
    Fittest: function (pop) {
      return pop[0].entity;
    },
    Random: function (pop) {
      return pop[Math.floor(Math.random() * pop.length)].entity;
    },
    RandomLinearRank: function (pop) {
      this.internalGenState['rlr'] = this.internalGenState['rlr'] || 0;
      return pop[Math.floor(Math.random() * Math.min(pop.length, (this.internalGenState['rlr']++)))].entity;
    },
    Sequential: function (pop) {
      this.internalGenState['seq'] = this.internalGenState['seq'] || 0;
      return pop[(this.internalGenState['seq']++) % pop.length].entity;
    }
  };

  const Select2 = {
    Tournament2: function (pop) {
      return [Select1.Tournament2.call(this, pop), Select1.Tournament2.call(this, pop)];
    },
    Tournament3: function (pop) {
      return [Select1.Tournament3.call(this, pop), Select1.Tournament3.call(this, pop)];
    },
    Random: function (pop) {
      return [Select1.Random.call(this, pop), Select1.Random.call(this, pop)];
    },
    RandomLinearRank: function (pop) {
      return [Select1.RandomLinearRank.call(this, pop), Select1.RandomLinearRank.call(this, pop)];
    },
    Sequential: function (pop) {
      return [Select1.Sequential.call(this, pop), Select1.Sequential.call(this, pop)];
    },
    FittestRandom: function (pop) {
      return [Select1.Fittest.call(this, pop), Select1.Random.call(this, pop)];
    }
  };

  function Genetic() {

    // population
    this.fitness = null;
    this.seed = null;
    this.mutate = null;
    this.crossover = null;
    this.select1 = null;
    this.select2 = null;
    this.optimize = null;
    this.generation = null;
    this.notification = null;

    /**
     * The constraints key/value type
     * @typedef {Object} Constraint
     * @property {funtion(Array, Array): Array} exec
     * @property {string} constraintMethod
     * @property {string} name
     * @property {Array} constraintParam
     **/

    /**
     * constraints are a property that will operate on each generation population element.
     * @template {Object<string, ...Constraint>} T
     * @param {T} 
     **/
    this.constraints = {};

    this.configuration = {
      size: 250,
      crossover: 0.9,
      mutation: 0.2,
      iterations: 100,
      fittestAlwaysSurvives: true,
      maxResults: 100,
      skip: 0,
    };

    this.userData = {};
    this.internalGenState = {};

    this.entities = [];

    this.start = function () {

      const self = this;

      function mutateOrNot(entity) {
        // applies mutation based on mutation probability
        return Math.random() <= self.configuration.mutation && self.mutate ?
          self.mutate(Clone(entity)) :
          entity;
      }

      // seed the population
      for (let i = 0; i < this.configuration.size; ++i) {
        this.entities.push(Clone(this.seed()));
      }

      for (let i = 0; i < this.configuration.iterations; ++i) {
        // reset for each generation
        this.internalGenState = {};

        // score and sort
        const pop = this.entities
          .map((entity) => {
            return { fitness: self.fitness(entity), entity };
          })
          .sort((a, b) => {
            return self.optimize(a.fitness, b.fitness) ? -1 : 1;
          });

        // generation notification
        const mean = pop.reduce(function (a, b) { return a + b.fitness; }, 0) / pop.length;
        // var stdev = Math.sqrt(pop
        //   .map(function (a) {
        //     return (a.fitness - mean) * (a.fitness - mean);
        //   })
        //   .reduce(function (acc, b) {
        //     return acc + b;
        //   }, 0) / pop.length);

        const stdev = Math.sqrt(pop
          // .map(function (a) {
          //   return (a.fitness - mean) * (a.fitness - mean);
          // })
          .reduce(function (acc, a) {
            const variance = (a.fitness - mean) ** 2
            return acc + variance;
          }, 0) / pop.length);

        const stats = {
          maximum: pop[0].fitness,
          minimum: pop[pop.length - 1].fitness,
          mean,
          stdev,
        };

        // var r = this.generation ? this.generation(pop, i, stats) : true;
        var r = this.generation ? this.generation(pop.slice(0, this.configuration['maxResults']), i, stats) : true;
        var isFinished = (typeof r != 'undefined' && !r) || (i == this.configuration.iterations - 1);

        if (
          this.notification
          && (isFinished || this.configuration['skip'] == 0 || i % this.configuration['skip'] == 0)
        ) {
          // this.sendNotification(pop.slice(0, this.maxResults), i, stats, isFinished);
          this.sendNotification(pop.slice(0, this.configuration['maxResults']), i, stats, isFinished);
        }

        if (isFinished) {
          break;
        }

        // crossover and mutate
        const newPop = [];

        // lets the best solution fall through
        if (this.configuration.fittestAlwaysSurvives) {
          newPop.push(pop[0].entity);
        }

        while (newPop.length < self.configuration.size) {
          if (
            this.crossover // if there is a crossover function
            && Math.random() <= this.configuration.crossover // base crossover on specified probability
            && newPop.length + 1 < self.configuration.size // keeps us from going 1 over the max population size
          ) {
            const parents = this.select2(pop);
            const children = this.crossover(Clone(parents[0]), Clone(parents[1])).map(mutateOrNot);

            if (Object.keys(this.constraints).length !== 0) {
              const constrainedChildren0 = runConstraintChild(children[0], this.constraints);
              const constrainedChildren1 = runConstraintChild(children[1], this.constraints);

              newPop.push(constrainedChildren0, constrainedChildren1);

            } else {
              newPop.push(children[0], children[1]);
            }


          } else {
            const child = mutateOrNot(self.select1(pop));

            if (Object.keys(this.constraints).length !== 0) {
              const constrainedChild = runConstraintChild(child, this.constraints);

              newPop.push(constrainedChild);
            } else {
              newPop.push(child);
            }
          }
        }

        this.entities = newPop;
      }
    }

    this.sendNotification = function (pop, generation, stats, isFinished) {
      const response = {
        pop: pop.map(Serialization.stringify),
        generation,
        stats,
        isFinished,
      };

      this.notification(response.pop.map(Serialization.parse), response.generation, response.stats, response.isFinished);
    };
  }

  Genetic.prototype.evolve = function (config, userData, constraints) {

    for (const key in config) {
      if (Object.hasOwnProperty.call(config, key)) {
        this.configuration[key] = config[key]
      }
    }

    for (const key in userData) {
      if (Object.hasOwnProperty.call(userData, key)) {
        this.userData[key] = userData[key];
      }
    }

    for (const name in constraints) {
      if (Object.hasOwnProperty.call(constraints, name)) {
        // constraintMethods {bitFix, drop, operation}
        // const { exec, constraintMethod, constraintParam } = constraints[name]
        this.constraints[name] = constraints[name];
      }
    }
    this.start();
  }

  return {
    create: function () {
      return new Genetic();
    },
    Clone,
    Select1,
    Select2,
    Optimize,
  };

})();


// so we don't have to build to run in the browser
if (typeof module != 'undefined') {
  module.exports = Genetic;
}

},{}]},{},[1]);
