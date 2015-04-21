import pkg_resources
import requests

from urlparse import urlparse

from xblock.core import XBlock
from xblock.fields import Scope, String
from xblock.fragment import Fragment
from xml.sax.saxutils import unescape


class SnapContextBlock(XBlock):
    """
    An XBlock providing snap content inside an iframe
    """
    problem_host = String(help="Launchpad for snap content",
                          default='http://temomachine3.bioinformatics.vt.edu:8010/snap/launch/', scope=Scope.content)
    problem_name = String(help="Name of the problem", default='SnapDemo.xml', scope=Scope.content)

    def student_view(self, context):
        """
        Create a fragment used to display the XBlock to a student.
        `context` is a dictionary used to configure the display (unused).

        Returns a `Fragment` object specifying the HTML, CSS, and JavaScript
        to display.
        """

        # Get the problem name
        problem_name = self.problem_name
        problem_host = self.problem_host

        absolute_snap_problem_url = str(problem_host) + str(problem_name)

        # Load the HTML fragment from within the package and fill in the template
        html_str = pkg_resources.resource_string(__name__, "static/html/snap_context.html")
        frag = Fragment(unicode(html_str).format(self=self, absolute_snap_problem_url=absolute_snap_problem_url))

        return frag

    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("snap context",
             """
            <vertical_demo>
                <snap_context />
            </vertical_demo>
            """)
        ]
