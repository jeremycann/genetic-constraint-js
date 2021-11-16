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

// If One of indexes array then keep all in group.
const ifPickedKeepGroup = (variadicParams) => ({
  name: 'ifPickedKeepGroup',
  constraintMethod: 'fix',
  constraintParams: variadicParams,
  exec(pop, [indexes, keepParam]) {
    let ifPickedKeepGroup = null;

    outerLoopKeep:
    for (const keep of indexes) {
      for (let j = 0; j < pop.length; j++) {
        const isPicked = pop[keep] === 1;

        if (isPicked) {
          ifPickedKeepGroup = [];
          for (let k = 0; k < pop.length; k++) {
            ifPickedKeepGroup.push(pop[k] | keepParam[k]);
          }
          break outerLoopKeep;
        }
      }
    }
    if (!ifPickedKeepGroup) {
      return pop;
    }
    return ifPickedKeepGroup;
  }
});

const ifPickedKeepGroupAlternative = (indexesParam) => ({
  name: 'ifPickedKeepGroup',
  constraintMethod: 'fix',
  constraintParams: indexesParam,
  exec(pop, indexes) {

    outerLoopKeep:
    for (const keep of indexes) {
      for (let j = 0; j < pop.length; j++) {
        const isPicked = pop[keep] === 1;

        if (isPicked) {
          for (const keep of indexes) {
            pop[keep] = 1;
          }
          break outerLoopKeep;
        }
      }
    }
    return pop;
  }
});

module.exports = {
  mustHaveConstraint,
  mustExludeConstraint,
  ifPickedKeepGroup,
  ifPickedKeepGroupAlternative
};