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
  // if it's not a recurring event, just lift and return
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
  const eventReturn: T[] = [];
  const repeatInstances = xmlDom.querySelector('repeatInstances');
  const rTotal = !!repeatInstances ? parseInt(repeatInstances.textContent!) : DEFAULT_RECURRENCE_TOTAL;

  const dailyNode = xmlDom.querySelector('daily');
  // basically, we are calculating the start time of each occurence, then the createNewEvent function
  // can create the end time and the rest of the event.
  if(!!dailyNode) {
    const dayFreq: number = parseInt(dailyNode.getAttribute('dayFrequency')!);
    if(!!dayFreq) {
      const recurStart = new Date(startDate.toString());
      let total = 0;
      while(isNotAtEnd(recurStart, endDate, bounds.end, rTotal, total)) {
        // probably need to put something here, move the date forward and increse total.  "Increment" the loop conditions
        if(recurStart.getTime() >= startDate.getTime() 
          && (!bounds.start || (bounds.start && recurStart.getTime() >= bounds.start.getTime()))) {

          const newStart = new Date(recurStart.toString());
          const newEvent = createNewEvent(event, newStart);
          eventReturn.push(newEvent);
          
        }
        // loop "increment" statements, should happen every iteration
        total++;
        recurStart.setDate(recurStart.getDate() + dayFreq);
      }
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
    while(isNotAtEnd(recurStart, endDate, bounds.end, rTotal, total)) {

      // every time week is incremented by freq, check every weekday (su-sa) to create all events for the week
      weekDays.forEach((weekDay, index) => {
        if((weeklyNode.hasAttribute(weekDay) && weeklyNode.getAttribute(weekDay) === 'TRUE')
          && (rTotal === DEFAULT_RECURRENCE_TOTAL || rTotal > total)) {
            total++; //increment total here, in case we hit max number in middle of week
            const newStart = new Date(recurStart.toString()); // create a copy of the loop Date
            newStart.setDate(newStart.getDate() + (index - recurDay)); // update the weekday

            // start bound check, use newStart in case bound is in the middle of the week
            if((!bounds.start || (bounds.start && newStart.getTime() >= bounds.start.getTime()))
            && newStart.getTime() <= endDate.getTime()
            && (!bounds.end || (bounds.end && newStart.getTime() <= bounds.end.getTime()))){
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
        total++;
        recurStart.setMonth(recurStart.getMonth() + monthFreq);
      }
    }
  }

  const monthlyByDayNode = xmlDom.querySelector('monthlyByDay');
  if(!!monthlyByDayNode) {
    const monthFreq = parseInt(monthlyByDayNode.getAttribute('monthFrequency')!);
    const weekdayOfMonth = monthlyByDayNode.getAttribute('weekdayOfMonth')!;
    const day: number = weekDays.reduce((acc, d, index) => // find which day attribute is present, I think only one can be present
      monthlyByDayNode.hasAttribute(d) && monthlyByDayNode.getAttribute(d) === 'TRUE'
        ? index
        : acc
      , SUNDAY);
    const recurStart = new Date(startDate.toString());
    let total = 0;

    while(isNotAtEnd(recurStart, endDate, bounds.end, rTotal, total)) {

      let newStart = new Date(recurStart.toString());
      if(recurStart.getTime() >= startDate.getTime()) {

        total++;
        if(!bounds.start || (bounds.start && recurStart.getTime() >= bounds.start.getTime())) {
          newStart.setDate(FIRST_DAY_OF_MONTH);
          const dayOfMonth = newStart.getDay();
          if (day < dayOfMonth) newStart.setDate(newStart.getDate() + ((NUMBER_OF_WEEKDAYS - dayOfMonth) + day)); //first instance of this day in the selected month
          else newStart.setDate(newStart.getDate() + (day - dayOfMonth));
          // find the date
          if(weekdayOfMonth === 'last') {
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
    const yearFreq = parseInt(yearlyNode.getAttribute('yearFrequency')!);
    // months are zero-based in javascript, but one-based in SharePoint
    const month = parseInt(yearlyNode.getAttribute('month')!) - MONTH_OFFSET;
    const day = parseInt(yearlyNode.getAttribute('day')!);
    const recurStart = new Date(startDate.toString()); // date still modified
    let total = 0;
    
    if(!!yearFreq) {
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
    while(isNotAtEnd(recurStart, endDate, bounds.end, rTotal, total)) {

      let newStart = new Date(recurStart.toString());
      newStart.setMonth(month);
      if(recurStart.getTime() >= startDate.getTime()) { // this _should always_ be true, but check anyway
        total++;
        if(!bounds.start || (bounds.start && recurStart.getTime() >= bounds.start.getTime())) { // add start bound here, I think?
          newStart.setDate(FIRST_DAY_OF_MONTH);
          const dayOfMonth = newStart.getDay();
          if (day < dayOfMonth) newStart.setDate(newStart.getDate() + ((NUMBER_OF_WEEKDAYS - dayOfMonth) + day)); //first instance of this day in the selected month
          else newStart.setDate(newStart.getDate() + (day - dayOfMonth));
          // find the date
          if(weekOfMonth === 'last') {
            const temp = new Date(newStart.toString());
            while(temp.getMonth() === month) {
              newStart = new Date(temp.toString());
              temp.setDate(temp.getDate() + NUMBER_OF_WEEKDAYS);  // loop through month
            }
          } else {
            newStart.setDate(newStart.getDate() + (NUMBER_OF_WEEKDAYS * weekOfMonths.indexOf(weekOfMonth)));
          }

          if(newStart.getMonth() === month) {  // make sure it's still the same month
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
export const setAttributes = <E extends Element>(e: E, attrs: [string, string][]): E => {
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

/**
 * check for expand event function to determine if all recurrences of a recurring
 * event have already been calculated or not
 * @param recurStart the start of the event in the current recurrence iteration
 * @param endDate the end date of the recurring event (event.EndDate)
 * @param endBound the end bound of the recurring calculation (bounds.end)
 * @param recurrenceTotal the number of recurrences of the event (if set)
 * @param total the total number of events created (to be compared against recurrenceTotal)
 */
export const isNotAtEnd = (recurStart: Date, endDate: Date, endBound: Date | null, recurrenceTotal: number, total: number): boolean =>
  (recurStart.getTime() < endDate.getTime())
  && (!endBound || (endBound && recurStart.getTime() < endBound.getTime())) 
  && (recurrenceTotal === DEFAULT_RECURRENCE_TOTAL || recurrenceTotal > total);


export { expandEvent, ispe };
