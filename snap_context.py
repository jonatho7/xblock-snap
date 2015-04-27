import pkg_resources
import requests

from urlparse import urlparse

from xblock.core import XBlock
from xblock.fields import Scope, String, Integer
from xblock.fragment import Fragment
from xml.sax.saxutils import unescape


class SnapContextBlock(XBlock):
    """
    An XBlock providing snap content inside an iframe
    """
    problem_host = String(help="Launchpad for snap content",
                          # default='http://127.0.0.1:9000/snap/launch/',
                          default='http://temomachine3.bioinformatics.vt.edu:8010/snap/launch/',
                          scope=Scope.content)

    problem_name = String(help="Name of the problem", default='convertFtoC_studentProgram.xml', scope=Scope.content)

    teacher_instance = String(help="Reference to solved teacher instance of the problem",
                              default='convertFtoC_teacherProgram.xml', scope=Scope.content)

    opened_count = Integer(help="Number of times user has opened this snap xblock", default=0,
                            scope=Scope.user_state)

    watched_count = Integer(help="Number of times user has watched this snap instance", default=0,
                            scope=Scope.user_state)

    maxwidth = Integer(help="Maximum width of the Snap IDE", default=800, scope=Scope.content)
    maxheight = Integer(help="Maximum height of the Snap IDE", default=500, scope=Scope.content)




    def student_view(self, context):
        """
        Create a fragment used to display the XBlock to a student.
        `context` is a dictionary used to configure the display (unused).

        Returns a `Fragment` object specifying the HTML, CSS, and JavaScript
        to display.
        """

        # Increment the opened_count user variable
        self.opened_count += 1


        # Get the problem name
        problem_name = self.problem_name
        problem_host = self.problem_host

        absolute_snap_problem_url = str(problem_host) + str(problem_name)

        # Load the HTML fragment from within the package and fill in the template
        html_str = pkg_resources.resource_string(__name__, "static/html/snap_context.html")
        frag = Fragment(unicode(html_str).format(self=self,
                                                 absolute_snap_problem_url=absolute_snap_problem_url,
                                                 opened_count=self.opened_count,
                                                 watched_count=self.watched_count))


        # Add message event javascript
        js_str = pkg_resources.resource_string(__name__, 'static/js/messaging_xblock.js')
        frag.add_javascript(unicode(js_str))

        frag.initialize_js('java_script_initializer')

        return frag

    def studio_view(self, context):
        """
        Create a fragment used to display the edit view in the Studio.
        """
        html_str = pkg_resources.resource_string(__name__, "static/html/snap-xblock-edit.html")
        frag = Fragment(unicode(html_str).format(problem_name=self.problem_name, maxwidth=self.maxwidth, maxheight=self.maxheight))

        js_str = pkg_resources.resource_string(__name__, "static/js/snap-xblock-edit.js")
        frag.add_javascript(unicode(js_str))
        frag.initialize_js('SnapEditBlock')

        return frag

    @XBlock.json_handler
    def studio_submit(self, data, suffix=''):
        """
        Called when submitting the form in Studio.
        """
        self.maxwidth = data.get('maxwidth')
        self.maxheight = data.get('maxheight')
        self.problem_name = data.get('problem_name')

        return {'result': 'success'}


    @XBlock.json_handler
    def handle_watched_count(self, data, suffix=''):
        """

        Called to update the watched_count variable
        """
        if data.get('watched'):
            self.watched_count += 1

        return {'watched_count': self.watched_count}

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
