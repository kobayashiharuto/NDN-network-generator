import logging
from ndn.app import NDNApp
from ndn.types import InterestNack, InterestTimeout, InterestCanceled, ValidationFailure
from ndn.encoding import Name, Component, InterestParam

from lib.ndn_utils import send_interest


logging.basicConfig(format='[{asctime}]{levelname}:{message}',
                    datefmt='%Y-%m-%d %H:%M:%S',
                    level=logging.INFO,
                    style='{')


app = NDNApp()


async def main():
    try:
        # content = await send_interest(app, '/producer1/aaaa')
        # content = await send_interest(app, '/function1/xxaaa/(/producer1/aaa, /producer1/aaa)')
        content = await send_interest(app, '/function1/func/join/(/function2/func/join/(/producer1/hoge, /producer2/aa), /function4/func/join/(/producer4/huga, /producer4/hoxxge))')
        print(bytes(content) if content else None)
    except InterestNack as e:
        print(f'Nacked with reason={e.reason}')
    except InterestTimeout:
        print(f'Timeout')
    except InterestCanceled:
        print(f'Canceled')
    except ValidationFailure:
        print(f'Data failed to validate')
    finally:
        app.shutdown()


if __name__ == '__main__':
    app.run_forever(after_start=main())