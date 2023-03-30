# pyright: reportWildcardImportFromLibrary=false
from typing import *


# if TYPE_CHECKING:
# from typing_extensions import LiteralString

T = TypeVar("T")

from flask import Flask
from flask_restful import reqparse, abort, Api, Resource, fields, marshal_with
from flask_cors import CORS  # very important!!
from flask import g as shared_state

from the_wall_firmware import bridge_connect, groutio
from the_wall_firmware.groutio import binuid, color

app = Flask(__name__)
api = Api(app)
CORS(app)  # very important!!

AccessID = NewType("AccessID", str)


# === [ config ] ===
VERSION = "v0.1"

UID_MAX_STR_WIDTH = 8

API_LIST_SEPARATOR = ","
# === end ===


_HEX_CHARS = set("123456789ABCDEF")


# make a conveinieince function to add resources
def add_resource(
    *endpoints: str,
    version: bool | str = True,
) -> Callable[[type[T]], type[T]]:
    def add_resource_decorator(cls: Type[T]) -> Type[T]:
        nonlocal endpoints

        if version:
            vxx = version if isinstance(version, str) else VERSION
            endpoints = tuple(f"/{vxx}/{s}" for s in endpoints)

        api.add_resource(cls, *endpoints)
        return cls

    return add_resource_decorator


# api.add_resource(TodoList, "/todos")
# api.add_resource(Todo, "/todo/<todo_id>")


# # private to this module
# def _present_bins(
#     bins: Iterable[ServedBinUID], *, abort_on_fail: bool = False
# ) -> tuple[set[ServedBinUID], set[ServedBinUID]]:
#     """
#     :return: (present bins, missing bins)
#     """
#     bins = set(bins)
#     return (bins & HARD_CODED_BINS, bins - HARD_CODED_BINS)


parser = reqparse.RequestParser()
parser.add_argument("task")


def binuid_from_request(uid: str) -> binuid.BinUID | None:
    if len(uid) > UID_MAX_STR_WIDTH:
        return None

    if not all(c in _HEX_CHARS for c in uid):
        return None

    return binuid.fromrawstr(uid)


# Todo
# shows a single todo item and lets you delete a todo item

from datetime import datetime


def get_next_color() -> color.Color:
    if "colors_seq" not in shared_state:
        shared_state.colors_seq = [
            color.RED,
            color.CYAN,
            color.GREEN,
            color.MAGENTA,
            color.BLUE,
        ]

    ret = shared_state.colors_seq[0]
    shared_state.colors_seq.append(shared_state.colors_seq.pop(0))
    return ret


@add_resource("/highlight/access_id:<access_id>,bins:[<bins>]")
class Highlight(Resource):
    class HighightResponse(TypedDict):
        color: str
        access_id: AccessID
        failed_bins: list[binuid.BinUID]

    def get(
        self,
        bins: str,
        access_id: AccessID,
    ) -> "Highlight.HighightResponse":
        parsed_bins: set[binuid.BinUID] = {
            b
            for uid in bins.split(API_LIST_SEPARATOR)
            if (b := binuid_from_request(uid))
        }

        highlight_color = get_next_color()
        try:
            bridge_connect.transmit(
                groutio.message.SetBinHighlights(
                    bins=tuple(parsed_bins),
                    highlight=highlight_color,
                    seconds_duration=60,
                )
            )
            bridge_connect.transmit(groutio.message.DisplayHighlightsChanges())

            return self.__class__.HighightResponse(
                color=color.tohex(highlight_color),
                access_id=access_id,
                failed_bins=[],
            )
        except:
            return self.__class__.HighightResponse(
                color=color.tohex(highlight_color),
                access_id=access_id,
                failed_bins=list(parsed_bins),
            )


if __name__ == "__main__":
    app.run(debug=True, port=62301)  # change the port!
