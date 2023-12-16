import random
import time
from copy import deepcopy

from lxml import etree
from websockets.sync.client import connect
from websockets.exceptions import ConnectionClosedError


class Provider:
    def __init__(self, mei_path, min_measures=4, max_measures=20) -> None:
        self.mei = etree.parse(mei_path)
        self.min_measures = min_measures
        self.max_measures = max_measures
        self.cur_measure = 0

    def __iter__(self):
        return self

    def __next__(self):
        mei = deepcopy(self.mei)
        measures = mei.xpath('//*[local-name()="measure"]')

        start_measure = self.cur_measure
        num_measures = min(
            len(measures) - start_measure,
            random.randint(self.min_measures, self.max_measures),
        )
        if num_measures <= 0:
            raise StopIteration

        end_measure = start_measure + num_measures

        mei = deepcopy(self.mei)
        measures = mei.xpath('//*[local-name()="measure"]')
        for measure in measures[:start_measure]:
            measure.getparent().remove(measure)
        for measure in measures[end_measure:]:
            measure.getparent().remove(measure)

        self.cur_measure = self.cur_measure + num_measures

        return etree.tostring(mei), start_measure + 1, end_measure


def main(min_delay=0.5, max_delay=2):
    # provider = Provider(mei_path="Brahms_StringQuartet_Op51_No1.mei")
    print("Generating scores... ", end="", flush=True)
    provider = Provider(mei_path="Hummel_Concerto_for_trumpet.mei")
    scores = list(provider)
    print("Done.", flush=True)

    while True:
        num_scores = len(scores)
        current_num = 0

        while current_num < num_scores:
            try:
                with connect("ws://localhost:8765/ws?type=provider") as ws:
                    current_score, start_measure, end_measure = scores[current_num]
                    print(f"Sending measures {start_measure} to {end_measure}")
                    ws.send(current_score)
                    current_num += 1
                    delay = random.random() * (max_delay - min_delay) + min_delay
                    time.sleep(delay)
            except ConnectionClosedError:
                print("Connection closed. Trying again...")
                time.sleep(0.5)
            except ConnectionRefusedError:
                print("Connection refused. Trying again...")
                time.sleep(0.5)


if __name__ == "__main__":
    main()
