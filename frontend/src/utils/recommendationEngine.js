const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'for',
  'of',
  'the',
  'with',
]);

const ARTICLE_TYPE_ALIASES = {
  'blouses': ['blouse'],
  'dress': ['dress', 'gown'],
  'dresses': ['dress', 'gown'],
  'hoodies': ['hoodie'],
  'jackets': ['jacket', 'coat'],
  'jeans': ['jeans', 'denim'],
  'jumpsuit': ['jumpsuit', 'romper'],
  'jumpsuits': ['jumpsuit', 'romper'],
  'leggings': ['leggings'],
  'pants': ['pants', 'trousers'],
  'poncho': ['poncho'],
  'shirt': ['shirt', 'tee', 'tshirt', 't'],
  'shirts': ['shirt', 'tee', 'tshirt', 't'],
  'shorts': ['shorts', 'cutoffs'],
  'skirt': ['skirt'],
  'skirts': ['skirt'],
  'sweater': ['sweater', 'knit'],
  'sweatpants': ['sweatpants'],
  'tee': ['tee', 'tshirt', 'shirt', 't'],
  'tops': ['top', 'shirt', 'tee', 'blouse'],
};

function normalizeText(value = '') {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(value = '') {
  return normalizeText(value)
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !STOP_WORDS.has(token));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getArticleTokens(articleType = '') {
  const normalized = normalizeText(articleType);
  const baseTokens = tokenize(normalized);

  return unique(baseTokens.flatMap((token) => ARTICLE_TYPE_ALIASES[token] || [token]));
}

function getSharedTokens(sourceTokens, targetTokens) {
  const targetSet = new Set(targetTokens);
  return sourceTokens.filter((token) => targetSet.has(token));
}

function scoreProduct(product, prediction) {
  const productName = normalizeText(product.name);
  const productDescription = normalizeText(product.description);
  const nameTokens = tokenize(product.name);
  const descriptionTokens = tokenize(product.description);
  const predictedLabel = prediction.predictedLabel || '';
  const labelTokens = tokenize(predictedLabel);
  const articleTokens = getArticleTokens(prediction.multiAttrs?.articleType);
  const colorTokens = tokenize(prediction.multiAttrs?.baseColour);
  const productColorTokens = tokenize((product.availableColors || []).join(' '));

  let score = 0;
  const reasons = [];

  if (predictedLabel && productName === normalizeText(predictedLabel)) {
    score += 120;
    reasons.push('exact label match');
  }

  const sharedNameTokens = getSharedTokens(labelTokens, nameTokens);
  if (sharedNameTokens.length > 0) {
    score += sharedNameTokens.length * 20;
    reasons.push(`shared style tokens: ${sharedNameTokens.join(', ')}`);
  }

  const sharedDescriptionTokens = getSharedTokens(labelTokens, descriptionTokens);
  if (sharedDescriptionTokens.length > 0) {
    score += Math.min(sharedDescriptionTokens.length, 2) * 6;
    reasons.push('description overlap');
  }

  const sharedArticleTokens = getSharedTokens(articleTokens, [...nameTokens, ...descriptionTokens]);
  if (sharedArticleTokens.length > 0) {
    score += 24;
    reasons.push(`article type match: ${sharedArticleTokens[0]}`);
  }

  if (prediction.multiAttrs?.gender) {
    if (product.gender === prediction.multiAttrs.gender) {
      score += 18;
      reasons.push(`gender match: ${product.gender}`);
    } else if (product.gender === 'Unisex') {
      score += 8;
      reasons.push('unisex fallback');
    } else {
      score -= 12;
    }
  }

  const sharedColorTokens = getSharedTokens(colorTokens, productColorTokens);
  if (sharedColorTokens.length > 0) {
    score += 14;
    reasons.push(`color match: ${sharedColorTokens[0]}`);
  }

  if (prediction.confidence >= 0.9) {
    score += 4;
  }

  return {
    ...product,
    recommendationScore: score,
    recommendationReasons: reasons,
  };
}

function buildFallbackProducts(products, prediction) {
  const normalizedGender = prediction.multiAttrs?.gender;
  const normalizedColor = normalizeText(prediction.multiAttrs?.baseColour);

  return products
    .map((product) => {
      let score = 0;

      if (normalizedGender) {
        if (product.gender === normalizedGender) {
          score += 25;
        } else if (product.gender === 'Unisex') {
          score += 10;
        }
      }

      if (normalizedColor && tokenize((product.availableColors || []).join(' ')).includes(normalizedColor)) {
        score += 15;
      }

      return {
        ...product,
        recommendationScore: score,
        recommendationReasons: ['attribute fallback'],
      };
    })
    .filter((product) => product.recommendationScore > 0)
    .sort((left, right) => right.recommendationScore - left.recommendationScore);
}

export function recommendProducts(products, prediction) {
  const scoredProducts = products
    .map((product) => scoreProduct(product, prediction))
    .filter((product) => product.recommendationScore > 0)
    .sort((left, right) => right.recommendationScore - left.recommendationScore);

  const rankedProducts = scoredProducts.length > 0
    ? scoredProducts
    : buildFallbackProducts(products, prediction);

  const highlyRecommendedProducts = rankedProducts
    .filter((product) => product.recommendationScore >= 45)
    .slice(0, 6);

  const highIds = new Set(highlyRecommendedProducts.map((product) => product.id));
  const otherRecommendedProducts = rankedProducts
    .filter((product) => !highIds.has(product.id))
    .slice(0, 9);

  const finalHigh = highlyRecommendedProducts.length > 0
    ? highlyRecommendedProducts
    : rankedProducts.slice(0, 3);

  const finalHighIds = new Set(finalHigh.map((product) => product.id));
  const finalOther = otherRecommendedProducts.length > 0
    ? otherRecommendedProducts
    : rankedProducts.filter((product) => !finalHighIds.has(product.id)).slice(0, 9);

  return {
    highlyRecommendedProducts: finalHigh,
    otherRecommendedProducts: finalOther,
    summary: {
      totalMatches: rankedProducts.length,
      topScore: rankedProducts[0]?.recommendationScore || 0,
      usedFallback: scoredProducts.length === 0 && rankedProducts.length > 0,
    },
  };
}
