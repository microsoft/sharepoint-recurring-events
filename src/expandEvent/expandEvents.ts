/**
 * external exports can be found at the bottom of the file, 
 * all other exports are for testing purposes
*/
import { unescape, cloneDeep } from 'lodash';
const NUMBER_OF_WEEKDAYS = 7;
const MONTH_OFFSET = 1;
const DEFAULT_RECURRENCE_TOTAL = 0;
const FIRST_DAY_OF_MONTH = 1;
const SUNDAY = 0;
const MIDNIGHT = 0;

interface ispe {
  fRecurrence: boolean;
  EventDate: string;
  EndDate: string;
  Duration: number;
  RecurrenceData: string | null;
  fAllDayEvent: boolean;
}

interface IBounds {
  start: Date | null;
  end: Date | null;
}

const expandEvent = <T extends ispe>(event: T, bounds: IBounds = {start: null, end: null}): T[] => {
  // if it's not a recurring event, just return it
  if(!event.fRecurrence || event.RecurrenceData === null) return [event];


  const weekDays = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
  const weekOfMonths = ['first', 'second', 'third', 'fourth'];

  const startDate: Date = event.fAllDayEvent
    // remove the "Z"/timezone info from the ISO date string so it parses as midnight local time, not UTC
    // (allow magic numbers to perform this calculation)
    ? new Date(event.EventDate.substring(0, event.EventDate.length - 1)) // eslint-disable-line no-magic-numbers
    : new Date(event.EventDate);
  const endDate = new Date(event.EndDate);
  const xmlDom = (new DOMParser()).parseFromString(unescape(event.RecurrenceData), 'text/xml');


  const eventReturn: T[] = []; // still pushed to

  const repeatInstances = xmlDom.querySelector('repeatInstances');
  const rTotal = !!repeatInstances ? parseInt(repeatInstances.textContent!) : DEFAULT_RECURRENCE_TOTAL;

  const dailyNode = xmlDom.querySelector('daily');
  // basically, we are calculating the start time of each occurence, then the createNewEvent function
  // can create the end time and the rest of the event.
  if(!!dailyNode) {
    const dayFreq: number = parseInt(dailyNode.getAttribute('dayFrequency')!);
    if(!!dayFreq) {
      // -- usage example -- the simplest example... not sure if this is generic enough to work for all of them
      return Array.from(dateGen(startDate, endDate, bounds, rTotal, d => {const upD = new Date(d); upD.setDate(upD.getDate()+ dayFreq); return upD;}))
        .map(start => createNewEvent(event, start));
    }
    else if(dailyNode.hasAttribute('weekday') && dailyNode.getAttribute('weekday') === 'TRUE') {
      const weekly = setAttributes(document.createElement('weekly'), [
        ['mo', 'TRUE'],
        ['tu', 'TRUE'],
        ['we', 'TRUE'],
        ['th', 'TRUE'],
        ['fr', 'TRUE'],
        ['weekFrequency', '1'], // attr key will always be lower case
      ]);
      xmlDom.querySelector('repeat')!.appendChild( weekly );
    }
  }

  const weeklyNode = xmlDom.querySelector('weekly');
  if(!!weeklyNode) {

    // uppercase for weekly from SharePoint, lower case for "weekday" recurrence, node set above ^^
    const weekFreq = parseInt(weeklyNode.getAttribute('weekFrequency') || weeklyNode.getAttribute('weekfrequency')!);
    const recurStart = new Date(startDate.toString()); // date still modified
    let recurDay = recurStart.getDay();
    let total = 0;
    // while((recurStart.getTime() <= endDate.getTime())
    //   && (!bounds.end || (bounds.end && recurStart <= bounds.end))
    //   && (rTotal === 0 || rTotal > total)) {
    while(isNotAtEnd(recurStart, endDate, bounds.end, rTotal, total)) {

      // every time week is incremented by freq, check every weekday (su-sa) to create all events for the week
      weekDays.forEach((weekDay, index) => {
        if((weeklyNode.hasAttribute(weekDay) && weeklyNode.getAttribute(weekDay) === 'TRUE')
          && (rTotal === DEFAULT_RECURRENCE_TOTAL || rTotal > total)) {
            total++; //increment total here, in case we hit max number in middle of week
            const newStart = new Date(recurStart.toString()); // create a copy of the loop Date
            newStart.setDate(newStart.getDate() + (index - recurDay)); // update the weekday

            if(!bounds.start || (bounds.start && newStart.getTime() >= bounds.start.getTime())){ // start bound check, use newStart in case bound is in the middle of the week
              const newEvent = createNewEvent(event, newStart);
              eventReturn.push(newEvent);
            }
          }
      });
      // increment to the next week that has events
      recurStart.setDate(recurStart.getDate() + ((NUMBER_OF_WEEKDAYS*weekFreq) - recurDay));
      recurDay = SUNDAY;
    }
  }

  const monthlyNode = xmlDom.querySelector('monthly');
  if(!!monthlyNode) {

    // mostly copy-paste from daily
    const monthFreq = parseInt(monthlyNode.getAttribute('monthFrequency')!);
    const day = parseInt(monthlyNode.getAttribute('day')!);
    const recurStart = new Date(startDate.toString()); // date still modified
    let total = 0;
    
    if(!!monthFreq) {
      // while((recurStart.getTime() < endDate.getTime())
      //   &&(!bounds.end || (bounds.end && recurStart.getTime() < bounds.end.getTime())) 
      //   && (rTotal === 0 || rTotal > total)) {
      while(isNotAtEnd(recurStart, endDate, bounds.end, rTotal, total)) {
        if(recurStart.getTime() >= startDate.getTime()) {
          const newStart = new Date(recurStart.toString());
          newStart.setDate(day);
          if(newStart.getMonth() === recurStart.getMonth()
          && (!bounds.start || (bounds.start && newStart.getTime() >= bounds.start.getTime()))) {
            const newEvent = createNewEvent(event, newStart);
            eventReturn.push(newEvent);
          }
        }
        // loop increment statements
        total++; // should this only be updated if the above if statement succeeds?
        recurStart.setMonth(recurStart.getMonth() + monthFreq);
      }
    }
  }

  const monthlyByDayNode = xmlDom.querySelector('monthlyByDay');
  if(!!monthlyByDayNode) {

    // montly copy-paste from yearlyByDay
    const monthFreq = parseInt(monthlyByDayNode.getAttribute('monthFrequency')!);
    const weekdayOfMonth = monthlyByDayNode.getAttribute('weekdayOfMonth')!;
    const day: number = weekDays.reduce((acc, d, index) => // find which day attribute is present, I think only one can be present
      monthlyByDayNode.hasAttribute(d) && monthlyByDayNode.getAttribute(d) === 'TRUE'
        ? index
        : acc
      , SUNDAY);
    const recurStart = new Date(startDate.toString());
    let total = 0;

    // while((recurStart.getTime() < endDate.getTime())
    //   && (!bounds.end || (bounds.end && recurStart.getTime() < bounds.end.getTime())) 
    //   && (rTotal === 0 || rTotal > total)) {
    while(isNotAtEnd(recurStart, endDate, bounds.end, rTotal, total)) {

      let newStart = new Date(recurStart.toString());
      if(recurStart.getTime() >= startDate.getTime()) { // add start bound here, I think?

        total++; // this should be updated when outside bounds, but not recurStart
        if(!bounds.start || (bounds.start && recurStart.getTime() >= bounds.start.getTime())) { // add start bound here, I think?
          newStart.setDate(FIRST_DAY_OF_MONTH);
          const dayOfMonth = newStart.getDay();
          if (day < dayOfMonth) newStart.setDate(newStart.getDate() + ((NUMBER_OF_WEEKDAYS - dayOfMonth) + day)); //first instance of this day in the selected month
          else newStart.setDate(newStart.getDate() + (day - dayOfMonth));
          // find the date
          if(weekdayOfMonth === 'last') { // needs tested
            const temp = new Date(newStart.toString());
            while(temp.getMonth() === recurStart.getMonth()) {
              newStart = new Date(temp.toString());
              temp.setDate(temp.getDate() + NUMBER_OF_WEEKDAYS);  // loop through month
            }
          } else {
            newStart.setDate(newStart.getDate() + (NUMBER_OF_WEEKDAYS * weekOfMonths.indexOf(weekdayOfMonth)));
          }

          if(newStart.getMonth() === recurStart.getMonth()) {  // make sure it's still the same month
            const newEvent = createNewEvent(event, newStart);
            eventReturn.push(newEvent);
          }
        }
      }
      recurStart.setMonth(recurStart.getMonth() + monthFreq);
    
    }
  }

  const yearlyNode = xmlDom.querySelector('yearly');
  if(!!yearlyNode) {
    // mostly copy-paste from monthly
    const yearFreq = parseInt(yearlyNode.getAttribute('yearFrequency')!);
    const month = parseInt(yearlyNode.getAttribute('month')!) - MONTH_OFFSET; // months are zero-based in javascript, but one-based in SharePoint
    const day = parseInt(yearlyNode.getAttribute('day')!);
    const recurStart = new Date(startDate.toString()); // date still modified
    let total = 0;
    
    if(!!yearFreq) {
      // while((recurStart.getTime() < endDate.getTime()) 
      //   && (!bounds.end || (bounds.end && recurStart.getTime() < bounds.end.getTime())) 
      //   && (rTotal === 0 || rTotal > total)) {
      while(isNotAtEnd(recurStart, endDate, bounds.end, rTotal, total)) {
        if(recurStart.getTime() >= startDate.getTime()
        && (!bounds.start || (bounds.start && recurStart.getTime() >= bounds.start.getTime()))) {
          const newStart = new Date(recurStart.toString());
          newStart.setMonth(month); 
          newStart.setDate(day);
          const newEvent = createNewEvent(event, newStart);
          eventReturn.push(newEvent);
        }
        // loop increment statements
        total++;
        recurStart.setFullYear(recurStart.getFullYear() + yearFreq);
      }
    }
  }

  const yearlyByDayNode = xmlDom.querySelector('yearlyByDay');
  if(!!yearlyByDayNode) {
    const yearFreq: number = parseInt(yearlyByDayNode.getAttribute('yearFrequency')!);
    const month: number = parseInt(yearlyByDayNode.getAttribute('month')!) - MONTH_OFFSET;
    // no matter what the attribute name implies, this is the week of the month
    // and has nothing to do with which weekday
    const weekOfMonth: string = yearlyByDayNode.getAttribute('weekdayOfMonth')!;
    const recurStart: Date = new Date(startDate.toString());
    const day: number = weekDays.reduce((acc, d, index) => // find which day attribute is present, I guess only one can be?
      yearlyByDayNode.hasAttribute(d) && yearlyByDayNode.getAttribute(d) === 'TRUE'
        ? index
        : acc
      , SUNDAY);
    let total = 0;
    // I think this is the exact same check for _every single_ recurrence type
    // while((recurStart.getTime() < endDate.getTime())
    //   && (!bounds.end || (bounds.end && recurStart.getTime() < bounds.end.getTime())) 
    //   && (rTotal === 0 || rTotal > total)) {
    while(isNotAtEnd(recurStart, endDate, bounds.end, rTotal, total)) {

      let newStart = new Date(recurStart.toString());
      newStart.setMonth(month);
      if(recurStart.getTime() >= startDate.getTime()) { // this _should always_ be true
        total++; // loop incrementing, could this be moved to the bottom?  Or does it depend on the above conditional?
        if(!bounds.start || (bounds.start && recurStart.getTime() >= bounds.start.getTime())) { // add start bound here, I think?
          newStart.setDate(FIRST_DAY_OF_MONTH);
          const dayOfMonth = newStart.getDay();
          if (day < dayOfMonth) newStart.setDate(newStart.getDate() + ((NUMBER_OF_WEEKDAYS - dayOfMonth) + day)); //first instance of this day in the selected month
          else newStart.setDate(newStart.getDate() + (day - dayOfMonth));
          // find the date
          if(weekOfMonth === 'last') { // needs tested
            const temp = new Date(newStart.toString());
            while(temp.getMonth() === month) {
              newStart = new Date(temp.toString());
              temp.setDate(temp.getDate() + NUMBER_OF_WEEKDAYS);  // loop through month
            }
          } else {
            newStart.setDate(newStart.getDate() + (NUMBER_OF_WEEKDAYS * weekOfMonths.indexOf(weekOfMonth)));
          }

          if(newStart.getMonth() === month) {  // make sure it's still the same month
            // within this if statement seems to be everything that is shared between
            // types of recurrences, and could probably be moved out into a separate function
            const newEvent = createNewEvent(event, newStart);
            eventReturn.push(newEvent);
          }
        }
      }
      // loop incrementing statements
      recurStart.setFullYear(recurStart.getFullYear() + yearFreq);
      recurStart.setMonth(month);
      recurStart.setDate(FIRST_DAY_OF_MONTH);
    }
  }
  return eventReturn;

};


/** sets all of the listed attributes (attrs) on Element e  */
export const setAttributes = (e: Element, attrs: [string, string][]): Element => {
  attrs.forEach(([key, value]) => {
    e.setAttribute(key, value);
  });
  return e;
};

/**
 * this function takes the parts of the above if statement structure to help avoid
 * duplication of code and simplify the calculations being done in the expandEvents function
 * @param oldEvent the event with the recurrence information
 * @param newStart the calculcated start time of the current instance of the recurring event
 */
export const createNewEvent = <T extends ispe>(oldEvent: T, newStart: Date): T => {
  if(oldEvent.fAllDayEvent) newStart.setUTCHours(MIDNIGHT);
  const newEnd = new Date(newStart.toString());
  newEnd.setSeconds(newEnd.getSeconds() + oldEvent.Duration);
  const newEvent = cloneDeep(oldEvent);
  newEvent.EventDate = newStart.toISOString();
  newEvent.EndDate = newEnd.toISOString();
  return newEvent;
};

export const isNotAtEnd = (recurStart: Date, endDate: Date, endBound: Date | null, recurrenceTotal: number, total: number): boolean =>
  (recurStart.getTime() < endDate.getTime())
  && (!endBound || (endBound && recurStart.getTime() < endBound.getTime())) 
  && (recurrenceTotal === DEFAULT_RECURRENCE_TOTAL || recurrenceTotal > total);


export { expandEvent, ispe };


/// --- potential generic Generator Function for start date creation
const dateGen = function* (startDate: Date, endDate: Date, bounds: IBounds, rTotal: number, updateFn: ((d: Date) => Date)) {
  let total = 0;
  let iterDate = new Date(startDate);
  while(isNotAtEnd(iterDate, endDate, bounds.end, rTotal, total)) {
    // probably need to put something here, move the date forward and increse total.  "Increment" the loop conditions
    if(iterDate.getTime() >= startDate.getTime() 
      && (!bounds.start || (bounds.start && iterDate.getTime() >= bounds.start.getTime()))) {

      const newStart = new Date(iterDate);
      yield newStart;
      // const newEvent = createNewEvent(event, newStart);
      // eventReturn.push(newEvent);
      
    }
    // loop "increment" statements, should happen every iteration
    total++;
    iterDate = updateFn(iterDate);
    // iterDate.setDate(iterDate.getDate() + dayFreq);
  }
  return;
};