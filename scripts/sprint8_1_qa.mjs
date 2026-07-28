import { executeValidation } from '../products/business/idea-validator/index.js';

async function run() {
  const enInput = {
    businessIdea: 'A subscription tool that helps small restaurants reduce food waste by tracking inventory and suggesting orders.',
    targetCustomer: 'Independent restaurant owners with 1-3 locations',
    problem: 'They over-order inventory and waste food weekly, costing money',
    monetization: 'Monthly subscription per location',
  };

  const arInput = {
    businessIdea: 'منصة اشتراك تساعد المطاعم الصغيرة على تقليل هدر الطعام من خلال تتبع المخزون.',
    targetCustomer: 'أصحاب مطاعم مستقلة لديهم فرع واحد إلى ثلاثة فروع',
    problem: 'يبددون المال أسبوعياً بسبب طلب مخزون زائد',
    monetization: 'اشتراك شهري لكل فرع',
  };

  console.log('--- English run ---');
  const enResult = executeValidation(enInput, 'en');
  console.log('ok:', enResult.ok);
  console.log('state:', enResult.state);
  console.log('verdictKey:', enResult.verdictKey);
  console.log('total score:', enResult.score.total);
  console.log('\nReport text:\n');
  // print built text using report builder
  const { buildBusinessIdeaReportText } = await import('../products/business/idea-validator/report.js');
  console.log(buildBusinessIdeaReportText({
    productConfig: (await import('../products/business/idea-validator/product.config.js')).productConfig,
    content: (await import('../products/business/idea-validator/content.en.js')).default,
    language: 'en',
    result: enResult,
  }));

  console.log('\n--- Arabic run ---');
  const arResult = executeValidation(arInput, 'ar');
  console.log('ok:', arResult.ok);
  console.log('state:', arResult.state);
  console.log('verdictKey:', arResult.verdictKey);
  console.log('total score:', arResult.score.total);
  const { buildBusinessIdeaReportText: buildArText } = await import('../products/business/idea-validator/report.js');
  console.log(buildArText({
    productConfig: (await import('../products/business/idea-validator/product.config.js')).productConfig,
    content: (await import('../products/business/idea-validator/content.ar.js')).default,
    language: 'ar',
    result: arResult,
  }));

  console.log('\n--- Empty input validation (EN) ---');
  const empty = { businessIdea: '', targetCustomer: '', problem: '', monetization: '' };
  const emptyResultEn = executeValidation(empty, 'en');
  console.log('ok:', emptyResultEn.ok);
  console.log('validation errors:', emptyResultEn.validation.errors);

  console.log('\n--- Empty input validation (AR) ---');
  const emptyResultAr = executeValidation(empty, 'ar');
  console.log('ok:', emptyResultAr.ok);
  console.log('validation errors:', emptyResultAr.validation.errors.map(e => ({ field: e.field })));
}

run().catch((e) => { console.error(e); process.exit(1); });
