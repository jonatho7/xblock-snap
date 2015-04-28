import pkg_resources
import requests

from urlparse import urlparse

from xblock.core import XBlock
from xblock.fields import Scope, String, Integer, Float
from xblock.fragment import Fragment
#from xml.sax.saxutils import unescape
#from xblockutils.publish_event import PublishEventMixin

# Use this if django server is not available and you want to use custom snap version.
using_custom_snap_server = False
remote_problem_host = None


class SnapContextBlock(XBlock):
    """
    An XBlock providing snap content inside an iframe
    """

    if using_custom_snap_server:
        custom_problem_host = 'http://127.0.0.1:5000/snap'
        global remote_problem_host
        remote_problem_host = 'http://temomachine3.bioinformatics.vt.edu:8010/snap/getProject/'
    else:
        # Don't change this (URL) if you want to use remote version
        #custom_problem_host = 'http://temomachine3.bioinformatics.vt.edu:8010/snap/launch/'
        # Local version if django server is hosted on the machine
        custom_problem_host = 'http://127.0.0.1:9000/snap/launch/'

    problem_host = String(help="Launchpad for snap content",
                          default=custom_problem_host,
                          scope=Scope.content)

    problem_name = String(help="Name of the problem", default='convertFtoC', scope=Scope.content)

    opened_count = Integer(help="Number of times user has opened this snap xblock", default=0,
                            scope=Scope.user_state)

    watched_count = Integer(help="Number of times user has watched this snap instance", default=0,
                            scope=Scope.user_state)

    grade = Float(help="The student's grade", default=0, scope=Scope.user_state)

    max_width = Integer(help="Maximum width of the Snap IDE", default=1150, scope=Scope.content)

    max_height = Integer(help="Maximum height of the Snap IDE", default=500, scope=Scope.content)


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

        if using_custom_snap_server:
            # handle the url yourself
            absolute_snap_student_problem_url = str(problem_host) + '#open:' + str(remote_problem_host) + \
                                                str(problem_name) + '/' + 'student/'
        else:
            absolute_snap_student_problem_url = str(problem_host) + str(problem_name) + '/' + 'student/'

        # Load the HTML fragment from within the package and fill in the template
        html_str = pkg_resources.resource_string(__name__, "static/html/snap_context.html")
        frag = Fragment(unicode(html_str).format(self=self,
                                                 absolute_snap_problem_url=absolute_snap_student_problem_url,
                                                 opened_count=self.opened_count,
                                                 watched_count=self.watched_count))


        # Add message event javascript
        js_str = pkg_resources.resource_string(__name__, 'static/js/messaging_xblock.js')
        frag.add_javascript(unicode(js_str))

        # Add custom css file.
        css_str = pkg_resources.resource_string(__name__, 'static/css/custom_css.css')
        frag.add_css(unicode(css_str))

        frag.initialize_js('java_script_initializer')

        return frag

    def studio_view(self, context):
        """
        Create a fragment used to display the edit view in the Studio.
        """
        html_str = pkg_resources.resource_string(__name__, "static/html/snap-xblock-edit.html")

        frag = Fragment(unicode(html_str).format(problem_name=self.problem_name, max_width=self.max_width,
                                                 max_height=self.max_height))

        js_str = pkg_resources.resource_string(__name__, "static/js/snap-xblock-edit.js")
        frag.add_javascript(unicode(js_str))
        frag.initialize_js('SnapEditBlock')

        return frag

    @XBlock.json_handler
    def studio_submit(self, data, suffix=''):
        """
        Called when submitting the form in Studio.
        """
        self.max_width = data.get('max_width')
        self.max_height = data.get('max_height')
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
