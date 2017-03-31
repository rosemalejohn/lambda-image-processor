'use strict';

/**
 * Parses event object passed by the trigger
 * @return Object
 */
module.exports = (event) => {

    return event.Records && event.Records.length ? event.Records[0] : null;
};
