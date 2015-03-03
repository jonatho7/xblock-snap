import pkg_resources
import requests

from urlparse import urlparse

from xblock.core import XBlock
from xblock.fields import Scope, String
from xblock.fragment import Fragment
from xml.sax.saxutils import unescape


class SnapContextBlock(XBlock):
    """
    An XBlock providing oEmbed capabilities for video
    """

    problem_data_url = String(help="URL of the video page at the provider", default=None, scope=Scope.content)

    def student_view(self, context):
        """
        Create a fragment used to display the XBlock to a student.
        `context` is a dictionary used to configure the display (unused).

        Returns a `Fragment` object specifying the HTML, CSS, and JavaScript
        to display.
        """

        # Get the url where the snap json data is at. Unescape the xml-escaped url.
        # XML-Escaped URL: https://drive.google.com/uc?export=download&amp;id=0B-WWj_i0WSomWFlvcURmaExsbWM
        #   XML-UnEscaped URL: https://drive.google.com/uc?export=download&id=0B-WWj_i0WSomWFlvcURmaExsbWM
        xml_unescaped_url = unescape(self.problem_data_url)

        # Grab the content from the file as json.
        json_data = requests.get(xml_unescaped_url).json()

        snap_problem_pretext = json_data['snap_problem_pretext']
        snap_problem_url = json_data['snap_problem_url']
        snap_problem_posttext = json_data['snap_problem_posttext']

        # Load the HTML fragment from within the package and fill in the template
        html_str = pkg_resources.resource_string(__name__, "static/html/snap_context.html")
        frag = Fragment(unicode(html_str).format(self=self,
                                                 snap_problem_pretext=snap_problem_pretext,
                                                 snap_problem_url=snap_problem_url,
                                                 snap_problem_posttext=snap_problem_posttext))
        return frag

    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("snap_context",
             """
            <vertical_demo>
                <snap_context problem_data_url="https://drive.google.com/uc?export=download&amp;id=0B-WWj_i0WSomWFlvcURmaExsbWM" />
            </vertical_demo>
            """)
        ]
