const key = `aea339f73173b9cf57bcb462`;
const getUrl = (key, currency) => `https://v6.exchangerate-api.com/v6/${key}/latest/${currency}`

const getErrorMessage = errorType => ({
  'unsupported-code': 'A moeda não existe em nosso banco de dados',
  'base-code-only-on-pro': 'Informações de moedas que não sejam USD ou EUR só podem ser acessadas se estiver registrado',
  'malformed-request': 'O endpoint do seu request precisa seguir a estrutura à seguir: ...',
  'invalid-key': 'A chave da API não é válida',
  'quota-reached': 'A sua conta alcançou o limite de requests permitidos em seu plano atual',
  'not-available-on-plan': 'Seu plano atual não permite este tipo de request'
})[errorType] || 'Não foi possível obter as informações.'

const currencyOneEl = document.querySelector('[data-js="currency-one"]');
const currencyTwoEl = document.querySelector('[data-js="currency-two"]');
const currenciesEl = document.querySelector('[data-js="currencies-container"]')
const convertedValueEl = document.querySelector('[data-js="converted-value"]');
const valuePrecisionEl = document.querySelector('[data-js="conversion-precision"]');
const timesCurrencyOneEl = document.querySelector('[data-js="currency-one-times"]');


const showAlert = (err) => {
  const div = document.createElement('div');
  const button = document.createElement('button');

  div.textContent = err.message;
  div.classList.add('alert', 'alert-warning', 'alert-dismissible', 'fade', 'show')
  div.setAttribute('role', 'alert');

  button.classList.add('btn-close');
  button.setAttribute('type', 'button');
  button.setAttribute('aria-label', 'Close');
  button.setAttribute('data-bs-dismiss', 'alert');
  button.addEventListener('click', () => {
    div.remove();
  })

  div.appendChild(button);
  currenciesEl.insertAdjacentElement('afterend', div);
}


const state = (() => {
  let exchangeRate = {}

  return {
    getExchangeRate: () => exchangeRate,
    setExchangeRate: newExchangeRate => {
      if (!newExchangeRate.conversion_rates) {
        showAlert({ message: 'O objeto precisa ter uma propriedade convertion_rates' })
        return
      }

      exchangeRate = newExchangeRate
      return exchangeRate
    }
  }
})()

const fetchExchangeRate = async url => {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Sua conexão falhou. Não foi possível obter as informações')
    }

    const exchangeRateDate = await response.json();

    if (exchangeRateDate.result === 'error') {
      throw new Error(getErrorMessage(exchangeRateDate['error-type']))
    }

    return exchangeRateDate;

  } catch (err) {
    showAlert(err)

  }

}

const showInitialInfo = exchangeRate => {
  const getOptions = selectedCurrency => Object.keys(exchangeRate.conversion_rates)
    .map(currency => `<option ${currency === selectedCurrency ? 'selected' : ''}>${currency}</option>`)
    .join('')

  currencyOneEl.innerHTML = getOptions('USD');
  currencyTwoEl.innerHTML = getOptions('BRL');

  convertedValueEl.textContent = exchangeRate.conversion_rates.BRL.toFixed(2);
  valuePrecisionEl.textContent = `1 USD = ${exchangeRate.conversion_rates.BRL} BRL`;
}

const init = async () => {
  const exchangeRate = state.setExchangeRate(await fetchExchangeRate(getUrl(key, 'USD')));

  if (exchangeRate && exchangeRate.conversion_rates) {
    showInitialInfo(exchangeRate);
  }

}

const showUpdateRates = exchangeRate => {
  convertedValueEl.textContent = (timesCurrencyOneEl.value * exchangeRate.conversion_rates[currencyTwoEl.value]).toFixed(2)
  valuePrecisionEl.textContent = `1 ${currencyOneEl.value} = ${1 * exchangeRate.conversion_rates[currencyTwoEl.value]} ${currencyTwoEl.value}`
}

timesCurrencyOneEl.addEventListener('input', e => {
  const exchangeRate = state.getExchangeRate();
  convertedValueEl.textContent = (e.target.value * exchangeRate.conversion_rates[currencyTwoEl.value]).toFixed(2);
})

currencyTwoEl.addEventListener('input', () => {
  const exchangeRate = state.getExchangeRate();
  showUpdateRates(exchangeRate);
});

currencyOneEl.addEventListener('input', async e => {
  const exchangeRate = state.setExchangeRate(await fetchExchangeRate(getUrl(key, e.target.value)));
  showUpdateRates(exchangeRate)
})

init();