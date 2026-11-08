import { DocumentStage, InspectionConclusion, InspectionDetails, SpecContent } from '../types/spec';

/**
 * The single document title used on every page header, based on the workflow stage.
 *  - created  -> Technical Specification
 *  - evaluated -> Technical Evaluation of Bid
 *  - inspected -> Inspection of Supplied Goods
 */
export function getStageTitle(stage: DocumentStage | undefined): string {
  switch (stage) {
    case 'inspected':
      return 'Inspection of Supplied Goods';
    case 'evaluated':
      return 'Technical Evaluation of Bid';
    default:
      return 'Technical Specification';
  }
}

export function resolveStage(
  recordStage: DocumentStage | undefined,
  content: SpecContent
): DocumentStage {
  if (recordStage) return recordStage;
  if (content.stage) return content.stage;
  if (
    content.inspectionDetails?.chassisNo ||
    content.inspectionDetails?.engineNo ||
    content.inspectionDetails?.dateOfInspection
  ) {
    return 'inspected';
  }
  if (content.tenderNo || content.bidderName) return 'evaluated';
  return 'created';
}

export function isAcceptedConclusion(conclusion: InspectionConclusion | undefined): boolean {
  return conclusion !== 'Not Accepted' && conclusion !== 'Rejected';
}

/** Default conclusion wording, derived from the user's accepted / not-accepted choice. */
export function buildConclusionText(
  conclusion: InspectionConclusion | undefined,
  details?: InspectionDetails,
  content?: SpecContent
): string {
  const item = content?.vehicleCategory || 'the supplied item';
  const bidder =
    details?.selectedBidderName ||
    content?.bidderName ||
    'the selected bidder';
  const makeModel = [content?.make || details?.make, content?.model || details?.model]
    .filter(Boolean)
    .join(' ');
  const description = makeModel ? `${makeModel} ${item}` : item;

  if (!isAcceptedConclusion(conclusion)) {
    return (
      `The supplied ${description} from ${bidder} was inspected and found not to meet the ` +
      `technical requirements of the specification. It is therefore not accepted technically ` +
      `and shall not proceed to the next stage of the procurement process. The supplier is ` +
      `required to make good the deficiencies and offer the item for re-inspection.`
    );
  }

  if (conclusion === 'Accepted with Conditions') {
    return (
      `The supplied ${description} from ${bidder} was inspected and substantially meets the ` +
      `technical requirements of the specification, subject to the conditions recorded in this ` +
      `report. It is accepted technically on a conditional basis and may proceed to the next ` +
      `stage of the procurement process once the stated conditions are fulfilled.`
    );
  }

  return (
    `The supplied ${description} from ${bidder} was inspected and found to meet the technical ` +
    `requirements of the specification. It is hereby accepted technically and may proceed to ` +
    `the next stage of the procurement process.`
  );
}

/**
 * Standard "General Details of Inspection" lines. Extra user-defined lines are appended
 * from inspectionDetails.customDetailRows.
 */
export function getGeneralInspectionRows(content: SpecContent): Array<{ label: string; value: string }> {
  const d = content.inspectionDetails || {};
  const make = content.make || d.make || '';
  const model = content.model || d.model || '';
  const origin = content.countryOfOrigin || d.countryOfOrigin || '';

  return [
    { label: 'Engine Number', value: d.engineNo || '' },
    { label: 'Chassis Number', value: d.chassisNo || '' },
    { label: 'Date of Inspection', value: d.dateOfInspection || d.deliveryDate || '' },
    { label: 'Manufacture Year', value: d.manufacturingYear || '' },
    { label: 'Color', value: d.color || '' },
    { label: 'Odometer Reading', value: d.odometerReading || '' },
    { label: 'Make', value: make },
    { label: 'Model', value: model },
    { label: 'Origin', value: origin },
    ...(d.customDetailRows || []).map((r) => ({ label: r.label, value: r.value })),
  ];
}
